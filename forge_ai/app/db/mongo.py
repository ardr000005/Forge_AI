from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import MONGO_URI, DB_NAME

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("✅ MongoDB connected successfully")
except ConnectionFailure as e:
    print(f"❌ MongoDB connection failed: {e}")
    raise

db = client[DB_NAME]

contracts_collection = db["contracts"]
decisions_collection = db["decisions"]
logs_collection = db["logs"]
company_collection = db["company"]
