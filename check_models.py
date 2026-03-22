import google.generativeai as genai
import warnings

warnings.filterwarnings("ignore")
genai.configure(api_key='AIzaSyBYUAaQ-eerQjFnYHSbSKcAvvP8xU5rEDM')

print("Fetching models...")
try:
    with open("models.txt", "w") as f:
        models = genai.list_models()
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                f.write(m.name + "\n")
except Exception as e:
    print("Error fetching models:", e)
