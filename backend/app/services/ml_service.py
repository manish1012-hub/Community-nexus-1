import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import roc_auc_score, precision_score, recall_score
import math

class MLAnalyticsService:
    def __init__(self):
        self.model = None
        self.feature_names = []
        self.trained = False
        self._init_and_train_baseline_model()

    def _generate_synthetic_training_cohort(self, n_samples: int = 2500) -> pd.DataFrame:
        """
        Generates realistic synthetic epidemiological training cohort
        reflecting chronic disease patients (hypertension, diabetes, heart disease)
        and associated polypharmacy risks.
        """
        np.random.seed(42)
        
        ages = np.random.randint(25, 88, size=n_samples)
        genders = np.random.choice(["Female", "Male"], size=n_samples, p=[0.52, 0.48])
        conditions = np.random.choice(
            ["Hypertension", "Type 2 Diabetes", "Hypertension & T2D", "Cardiovascular Disease", "Dyslipidemia"],
            size=n_samples,
            p=[0.35, 0.25, 0.20, 0.12, 0.08]
        )
        med_counts = np.random.poisson(lam=3.8, size=n_samples) + 1
        med_counts = np.clip(med_counts, 1, 12)
        
        med_classes = np.random.choice(
            ["ACE Inhibitor", "ARB", "Beta Blocker", "Biguanide (Metformin)", "Statin", "SGLT2 Inhibitor", "Calcium Channel Blocker", "Diuretic"],
            size=n_samples
        )
        
        has_diabetes = np.array(["Diabetes" in c for c in conditions], dtype=int)
        has_renal = np.random.binomial(1, p=np.clip((ages - 40) / 100 * 0.35, 0.02, 0.40))

        # Risk formula based on established pharmacovigilance literature:
        # Age > 65, Polypharmacy (>5 drugs), Renal impairment, specific combinations
        risk_logit = (
            -3.2
            + (ages > 65) * 0.85
            + (med_counts > 5) * 1.15
            + (med_counts > 8) * 0.90
            + has_renal * 1.30
            + (has_diabetes & (med_classes == "Diuretic")) * 0.70
            + ((med_classes == "ACE Inhibitor") & has_renal) * 0.80
            + np.random.normal(0, 0.4, size=n_samples)
        )
        
        risk_prob = 1 / (1 + np.exp(-risk_logit))
        severe_adr = (risk_prob > 0.45).astype(int)

        df = pd.DataFrame({
            "age": ages,
            "gender": genders,
            "primary_condition": conditions,
            "medication_count": med_counts,
            "medication_class": med_classes,
            "has_diabetes": has_diabetes,
            "has_renal_impairment": has_renal,
            "severe_adr": severe_adr
        })
        return df

    def _init_and_train_baseline_model(self):
        df = self._generate_synthetic_training_cohort()
        
        X = pd.get_dummies(df[[
            "age", "gender", "primary_condition", "medication_count",
            "medication_class", "has_diabetes", "has_renal_impairment"
        ]], drop_first=True)
        
        y = df["severe_adr"]
        self.feature_names = list(X.columns)

        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42,
            class_weight="balanced"
        )
        self.model.fit(X, y)
        self.trained = True

    def predict_risk(self, data: dict) -> dict:
        """
        Evaluates individualized ADR risk for a patient context.
        """
        # Create a single row DataFrame
        row_dict = {
            "age": data.get("age", 55),
            "gender": data.get("gender", "Female"),
            "primary_condition": data.get("primary_condition", "Hypertension"),
            "medication_count": data.get("medication_count", 3),
            "medication_class": data.get("medication_class", "ACE Inhibitor"),
            "has_diabetes": int(data.get("has_diabetes", False)),
            "has_renal_impairment": int(data.get("has_renal_impairment", False))
        }
        df_single = pd.DataFrame([row_dict])
        
        # Build dummy frame matching feature_names
        X_encoded = pd.get_dummies(df_single)
        X_full = pd.DataFrame(0, index=[0], columns=self.feature_names)
        for col in X_encoded.columns:
            if col in X_full.columns:
                X_full[col] = X_encoded[col]

        probs = self.model.predict_proba(X_full)[0]
        risk_score = round(float(probs[1]), 3)

        if risk_score < 0.25:
            risk_level = "Low"
        elif risk_score < 0.55:
            risk_level = "Moderate"
        elif risk_score < 0.75:
            risk_level = "High"
        else:
            risk_level = "Critical"

        # Calculate feature importances
        raw_importances = dict(zip(self.feature_names, self.model.feature_importances_))
        top_features = dict(sorted(raw_importances.items(), key=lambda item: item[1], reverse=True)[:5])
        
        # Normalize top feature weights to percentages
        total_top = sum(top_features.values()) or 1.0
        normalized_features = {k: round(v / total_top * 100, 1) for k, v in top_features.items()}

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": round(float(max(probs)), 2),
            "feature_importance": normalized_features,
            "clinical_disclaimer": "ACADEMIC DECISION-SUPPORT PROTOTYPE ONLY: This risk score represents statistical correlation derived from synthetic observational cohorts. It is NOT a clinical diagnosis or treatment recommendation. Always consult clinical guidelines and primary care physician judgment.",
            "model_version": "RandomForest-v1.4.2-PharmacoRisk"
        }

    @staticmethod
    def calculate_disproportionality(reports: list) -> list:
        """
        Computes pharmacovigilance disproportionality metrics:
        - PRR (Proportional Reporting Ratio)
        - ROR (Reporting Odds Ratio)
        - Chi-Square with Yates' continuity correction
        Standard WHO UMC & FDA FAERS methodology.
        """
        if not reports or len(reports) < 4:
            return []

        df = pd.DataFrame(reports)
        total_reports = len(df)

        signals = []
        # Group by medication and reaction
        med_reaction_counts = df.groupby(["medication_name", "reaction_category"]).size().reset_index(name="count_a")
        med_counts = df.groupby("medication_name").size().to_dict()
        reaction_counts = df.groupby("reaction_category").size().to_dict()

        for _, row in med_reaction_counts.iterrows():
            med = row["medication_name"]
            reaction = row["reaction_category"]
            a = row["count_a"] # target drug with target event
            b = med_counts[med] - a # target drug with other events
            c = reaction_counts[reaction] - a # other drugs with target event
            d = total_reports - (a + b + c) # other drugs with other events

            if a < 2:
                continue

            # PRR = [a / (a + b)] / [c / (c + d)]
            if (a + b) > 0 and (c + d) > 0 and c > 0:
                prr = (a / (a + b)) / (c / (c + d))
            else:
                prr = 1.0

            # ROR = (a * d) / (b * c)
            if b > 0 and c > 0 and d > 0:
                ror = (a * d) / (b * c)
            else:
                ror = prr

            # Chi-square with Yates' correction: N * (|a*d - b*c| - N/2)^2 / [(a+b)(c+d)(a+c)(b+d)]
            N = a + b + c + d
            denom = (a + b) * (c + d) * (a + c) * (b + d)
            num = (abs(a * d - b * c) - (N / 2)) ** 2
            chi2 = (N * num / denom) if denom > 0 else 0.0

            # Signal criterion: PRR >= 2.0, count >= 3, chi_square >= 4.0
            signal_detected = (prr >= 2.0 and a >= 3 and chi2 >= 3.84)

            signals.append({
                "medication_name": med,
                "reaction_category": reaction,
                "report_count": int(a),
                "prr": round(float(prr), 2),
                "ror": round(float(ror), 2),
                "chi_square": round(float(chi2), 2),
                "signal_detected": bool(signal_detected)
            })

        # Sort by PRR descending
        signals.sort(key=lambda x: x["prr"], reverse=True)
        return signals

ml_service = MLAnalyticsService()
