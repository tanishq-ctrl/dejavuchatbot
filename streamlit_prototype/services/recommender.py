import pandas as pd

class RecommenderEngine:
    def __init__(self, data_path="data/properties.csv"):
        try:
            self.df = pd.read_csv(data_path)
            # Ensure bedrooms are numeric
            self.df['bedrooms'] = pd.to_numeric(self.df['bedrooms'], errors='coerce').fillna(0)
            self.df['price_aed'] = pd.to_numeric(self.df['price_aed'], errors='coerce')
            
            self._perform_clustering()
        except Exception as e:
            print(f"Error loading data: {e}")
            self.df = pd.DataFrame()

    def _perform_clustering(self):
        """
        Groups properties into clusters:
        - Budget / Standard / Premium / Luxury (based on Price)
        - Location groupings
        """
        if self.df.empty or len(self.df) < 10:
            self.df['cluster_label'] = "General"
            return

        try:
            from sklearn.cluster import KMeans
            from sklearn.preprocessing import StandardScaler
            
            # Features: Price per sqft, size
            # Calculate price per sqft
            self.df['price_per_sqft'] = self.df['price_aed'] / self.df['size_sqft']
            
            features = self.df[['price_aed', 'size_sqft', 'price_per_sqft']].fillna(0)
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform(features)
            
            kmeans = KMeans(n_clusters=4, random_state=42)
            self.df['cluster_id'] = kmeans.fit_predict(features_scaled)
            
            # Label clusters strictly by avg price
            cluster_centers = self.df.groupby('cluster_id')['price_aed'].mean().sort_values()
            
            labels = {}
            names = ["Value Option", "Mid-Market", "Premium", "Ultra-Luxury"]
            for i, (cluster_id, _) in enumerate(cluster_centers.items()):
                labels[cluster_id] = names[i] if i < len(names) else "General"
                
            self.df['cluster_label'] = self.df['cluster_id'].map(labels)
            
        except ImportError:
            print("Scikit-learn not found, skipping clustering.")
            self.df['cluster_label'] = "General"
        except Exception as e:
            print(f"Clustering error: {e}")
            self.df['cluster_label'] = "General"

    def recommend(self, intent, limit=5):
        if self.df.empty:
            return []

        filtered = self.df.copy()
        
        # --- Hard Filters ---
        if intent.get("status"):
            filtered = filtered[filtered['status'].str.lower() == intent['status'].lower()]

        if intent.get("property_type"):
            if intent['property_type'] == "Villa":
                filtered = filtered[filtered['property_type'].isin(["Villa", "Townhouse"])]
            else:
                filtered = filtered[filtered['property_type'].isin(["Apartment", "Penthouse", "Studio"])]

        if intent.get("min_bedrooms") is not None:
             filtered = filtered[filtered['bedrooms'] >= intent['min_bedrooms']]

        if intent.get("max_budget"):
            filtered = filtered[filtered['price_aed'] <= intent['max_budget'] * 1.1]

        if intent.get("location"):
             loc = intent['location']
             filtered = filtered[
                 filtered['community'].str.contains(loc, case=False, na=False) |
                 filtered['city'].str.contains(loc, case=False, na=False) |
                 filtered['nearby_landmarks'].str.contains(loc, case=False, na=False)
             ]

        # If too few results, use fallback
        if len(filtered) == 0:
             filtered = self.df[self.df['featured'] == True].copy()
             intent["note"] = "Showing featured properties matching closest criteria."

        # --- Scoring ---
        filtered['score'] = filtered['featured'].apply(lambda x: 10 if x else 0)
        
        if intent.get("max_budget"):
             filtered['score'] += (1 - abs(filtered['price_aed'] - intent['max_budget']) / intent['max_budget']) * 5

        # Sort
        results = filtered.sort_values(by='score', ascending=False).head(limit)
        
        output = []
        for _, row in results.iterrows():
            prop = row.to_dict()
            prop['match_reasons'] = []
            
            # --- Enhanced Reasons with Clusters ---
            if 'cluster_label' in row:
                prop['match_reasons'].append(f"Category: {row['cluster_label']}")

            if row['featured']:
                prop['match_reasons'].append("🌟 Deja Vu Exclusive Opportunity")
            
            if intent.get("location") and intent['location'].lower() in str(row['community']).lower():
                prop['match_reasons'].append(f"Located in requested {row['community']}")
            
            if intent.get("max_budget") and row['price_aed'] <= intent['max_budget']:
                prop['match_reasons'].append("Within your budget")
            
            if row['roi_hint']:
                prop['match_reasons'].append(f"Investment Highlight: {row['roi_hint']}")

            output.append(prop)

        return output

    def get_related(self, target_rec, limit=2):
        """Get properties in same cluster but different community"""
        if self.df.empty or 'cluster_id' not in self.df.columns:
            return []
            
        cluster = target_rec.get('cluster_id')
        related = self.df[
            (self.df['cluster_id'] == cluster) & 
            (self.df['id'] != target_rec['id'])
        ].sample(min(limit, len(self.df)))
        
        return related.to_dict('records')

    def get_featured(self, limit=3):
        if self.df.empty: return []
        return self.df[self.df['featured'] == True].head(limit).to_dict('records')
