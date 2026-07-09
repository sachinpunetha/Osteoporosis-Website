import requests
import json
from models import db, User, PatientProfile, ClinicalRecord, Prediction

def generate_rag_context(patient_id):
    """
    Retrieves all patient data from the DB to build the RAG context block.
    """
    profile = PatientProfile.query.filter_by(user_id=patient_id).first()
    if not profile:
        return "No patient profile found. Cannot build context."

    clinical = ClinicalRecord.query.filter_by(patient_id=profile.id).order_by(ClinicalRecord.created_at.desc()).first()
    prediction = Prediction.query.filter_by(patient_id=profile.id).order_by(Prediction.created_at.desc()).first()

    context = f"PATIENT DEMOGRAPHICS:\n"
    context += f"- Age: {profile.age}\n- Gender: {profile.gender}\n- BMI: {round(profile.bmi, 2)}\n"
    
    if clinical:
        context += f"\nCLINICAL LAB RESULTS:\n"
        context += f"- Fasting Blood Glucose: {clinical.fbg}\n"
        context += f"- Uric Acid: {clinical.uric_acid}\n"
        context += f"- Serum Calcium: {clinical.serum_calcium}\n"
        context += f"- Vitamin D: {clinical.vitamin_d}\n"
        context += f"- Lumbar T-Score: {clinical.lumbar_t_score}\n"
        context += f"- Diabetes: {clinical.has_diabetes}\n"
        context += f"- Rheumatoid Arthritis: {clinical.has_rheumatoid_arthritis}\n"

    if prediction:
        context += f"\nAI XGBOOST DIAGNOSIS:\n"
        context += f"- Predicted Status: {prediction.diagnosis}\n"
        context += f"- Confidence: {prediction.confidence}%\n"

    return context


def ask_freellmapi(patient_id, user_question):
    """
    Calls the FreeLLMAPI (or OpenRouter) with the RAG context injected.
    """
    context = generate_rag_context(patient_id)
    
    system_prompt = (
        "You are OsteoCare AI, an expert medical assistant specializing in osteoporosis. "
        "You have access to the patient's specific lab results and our XGBoost AI prediction below. "
        "Always tailor your advice based strictly on their specific numbers. Keep responses concise and supportive.\n\n"
        f"=== PATIENT DATA ===\n{context}\n====================\n"
    )

    # FreeLLMAPI / OpenRouter setup
    # If the user doesn't have an explicit key, we use a dummy.
    # Note: If this fails (401), we will catch it and return a mocked response showing the context.
    API_KEY = "dummy_key_if_freellmapi_doesnt_require_one"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "qwen/qwen3-coder:free", # Using the model from the user's screenshot
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_question}
        ]
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            # Fallback mock response so the UI doesn't crash during demo
            return (
                f"[API ERROR {response.status_code}] Cannot reach FreeLLMAPI endpoint.\n\n"
                f"**But RAG successfully generated this context to send to the LLM:**\n\n{context}\n\n"
                f"*(If the API Key was valid, the LLM would answer your question: '{user_question}' using this data!)*"
            )
            
    except Exception as e:
        return f"Failed to connect to LLM: {str(e)}"
