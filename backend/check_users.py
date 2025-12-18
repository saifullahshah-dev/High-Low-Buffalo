import asyncio
from database import db
from pprint import pprint

async def main():
    try:
        users = await db.users.find().to_list(100)
        print(f"Total users found: {len(users)}")
        for user in users:
            print("---")
            pprint(user)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())