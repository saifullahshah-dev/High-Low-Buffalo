import requests
import json
import random
import string
import sys

BASE_URL = "http://localhost:8000/api/v1"

def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def register_user(email, password, full_name):
    url = f"{BASE_URL}/auth/signup"
    data = {
        "email": email,
        "password": password,
        "full_name": full_name
    }
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400 and "Email already registered" in response.text:
             return None
        else:
            print(f"Failed to register user {email}: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {BASE_URL}. Is the backend server running?")
        sys.exit(1)

def login_user(email, password):
    url = f"{BASE_URL}/auth/token"
    data = {
        "username": email,
        "password": password
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to login user {email}: {response.text}")
        return None

def create_herd(token, name, description):
    url = f"{BASE_URL}/herds/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "name": name,
        "description": description
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Failed to create herd: {response.text}")
        return None

def add_member(token, herd_id, member_email):
    url = f"{BASE_URL}/herds/{herd_id}/members"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "email": member_email
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to add member to herd: {response.text}")
        return None

def create_reflection(token, high, low, buffalo, shared_herds):
    url = f"{BASE_URL}/reflections/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "high": high,
        "low": low,
        "buffalo": buffalo,
        "sharedHerds": shared_herds
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Failed to create reflection: {response.text}")
        return None

def get_feed(token):
    url = f"{BASE_URL}/reflections/feed"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get feed: {response.text}")
        return None

def delete_herd(token, herd_id):
    url = f"{BASE_URL}/herds/{herd_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(url, headers=headers)
    if response.status_code == 204:
        print(f"Herd {herd_id} deleted successfully.")
        return True
    else:
        print(f"Failed to delete herd: {response.text}")
        return False

def main():
    print("--- Starting Herds Flow Test ---")

    # Generate unique emails for this run to avoid conflicts
    suffix = get_random_string()
    email_a = f"owner_{suffix}@example.com"
    email_b = f"member_{suffix}@example.com"
    password = "password123"

    print(f"\n1. Setting up users...")
    print(f"   User A: {email_a}")
    print(f"   User B: {email_b}")

    # Register/Login User A
    register_user(email_a, password, "User A")
    token_a_data = login_user(email_a, password)
    if not token_a_data:
        print("Failed to authenticate User A. Exiting.")
        return
    token_a = token_a_data["access_token"]
    print("   User A authenticated.")

    # Register/Login User B
    register_user(email_b, password, "User B")
    token_b_data = login_user(email_b, password)
    if not token_b_data:
        print("Failed to authenticate User B. Exiting.")
        return
    token_b = token_b_data["access_token"]
    print("   User B authenticated.")

    print(f"\n2. Herd Management...")
    # User A creates a herd
    herd = create_herd(token_a, "Test Herd", "A herd for testing")
    if not herd:
        print("Failed to create herd. Exiting.")
        return
    
    # Check for 'id' or '_id'
    herd_id = herd.get("id") or herd.get("_id")
    if not herd_id:
        print(f"Error: Could not find ID in herd response: {herd}")
        return
        
    print(f"   Herd 'Test Herd' created with ID: {herd_id}")
    
    # User A adds User B
    print(f"   Adding User B ({email_b}) to herd...")
    updated_herd = add_member(token_a, herd_id, email_b)
    if not updated_herd:
        print("Failed to add member. Exiting.")
        return
    
    # Verify User B is in members
    members = updated_herd.get("members", [])
    member_emails = [m.get("email") for m in members]
    if email_b in member_emails:
        print("   User B successfully added to herd.")
    else:
        print(f"   Error: User B not found in herd members: {member_emails}")
        return

    print(f"\n3. Reflection Sharing...")
    # User A creates reflection shared with herd
    print("   User A creating shared reflection...")
    reflection = create_reflection(
        token_a, 
        "High point", 
        "Low point", 
        "Buffalo point", 
        [herd_id]
    )
    if not reflection:
        print("Failed to create reflection. Exiting.")
        return
        
    reflection_id = reflection.get("id") or reflection.get("_id")
    print(f"   Reflection created: {reflection_id}")

    # User B checks feed
    print("   User B checking feed...")
    feed = get_feed(token_b)
    if feed is None:
        print("Failed to get feed. Exiting.")
        return
    
    # Verify reflection in feed
    found = False
    feed_ids = []
    for item in feed:
        item_id = item.get("id") or item.get("_id")
        feed_ids.append(item_id)
        if item_id == reflection_id:
            found = True
            break
    
    if found:
        print("   SUCCESS: Shared reflection found in User B's feed!")
    else:
        print("   FAILURE: Shared reflection NOT found in User B's feed.")
        print("   Feed contents ids:", feed_ids)

    print(f"\n4. Cleanup...")
    delete_herd(token_a, herd_id)
    print("--- Test Complete ---")

if __name__ == "__main__":
    main()