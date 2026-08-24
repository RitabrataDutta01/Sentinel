import os
from flask import render_template_string
from supabase import create_client, Client
from werkzeug.wrappers import response

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class SessionManager:

    def __init__(self):

        self.db = supabase

    def create_session(self, session_id: str, user_id: str, scenario: str, personality: str, context: str, brutal: bool, current_mood: int, mood_timeline: list[int]):

        data = {
            "id": session_id,
            "user_id": user_id,
            "scenario": scenario,
            "context": context,
            "personality": personality,
            "brutal_mode": brutal,
            "current_mood": current_mood,
            "mood_timeline": mood_timeline,
            "history": []
        }

        response = self.db.table("sessions").insert(data).execute()
        return response.data[0] if response.data else None

    def get_session(self, session_id: str):
        
        response = self.db.table("sessions").select("*").eq("id", session_id).execute()
        return response.data[0] if response.data else None

    def append_message(self, session_id: str, role: str, text: str):

        session = self.get_session(session_id)
        if session:
            history = session.get("history", [])
            history.append({
                "role": role,
                "parts": [text] 
            })
            self.db.table("sessions").update({"history": history}).eq("id", session_id).execute()
       
    def update_mood(self, session_id: str, new_mood: int):

        session = self.get_session(session_id)
        if session:
            timeline = session.get("mood_timeline", [])
            timeline.append(new_mood)
            self.db.table("sessions").update({
                "current_mood": new_mood,
                "mood_timeline": timeline
            }).eq("id", session_id).execute()

    def save_evaluation(self, session_id: str, report: dict, duration_sec: int = None):

        if duration_sec is not None:
            report["duration_sec"] = duration_sec

        self.db.table("sessions").update({"evaluation_report": report}).eq("id", session_id).execute()

    def signup_user(self, email: str, password: str, first_name: str = None, last_name: str = None, role: str = None):

        options = {}
        if first_name or last_name or role:
            options["data"] = {
                "first_name": first_name,
                "last_name": last_name,
                "role": role
            }

        response = self.db.auth.sign_up({
            "email": email,
            "password": password,
            "options": options
            })

        if response and response.user:
            try:
                profile_data = {"id": response.user.id}
                if first_name: profile_data["first_name"] = first_name
                if last_name: profile_data["last_name"] = last_name
                if role: profile_data["role"] = role
                self.db.table("profiles").upsert(profile_data).execute()
            except Exception as e:
                print(f"⚠️ Warning: Could not auto-generate profile row: {e}")

        return response

    def login_user(self, email: str, password: str):

        response = self.db.auth.sign_in_with_password({
            "email": email,
            "password": password
            })
        
        return response

    def create_or_get_profile(self, user_id: str, first_name: str = None, last_name: str = None, role: str = None):

        existing = self.db.table("profiles").select("*").eq("id", user_id).execute()
        if existing.data:
            return existing.data[0]

        data = {"id": user_id}
        if first_name: data["first_name"] = first_name
        if last_name: data["last_name"] = last_name
        if role: data["role"] = role

        response = self.db.table("profiles").insert(data).execute()
        return response.data[0] if response.data else None

    def get_org_for_user(self, user_id: str):

        """Return the user's most recent active membership + org, or None."""

        response = self.db.table("org_members").select("*").eq("user_id", user_id).eq("status", "active").order("created_at", desc=True).execute()
        if not response.data:
            return None

        membership = response.data[0]
        org_response = self.db.table("organizations").select("*").eq("id", membership["org_id"]).execute()
        org = org_response.data[0] if org_response.data else None

        return {
            "org": org,
            "membership": {
                "user_id": membership["user_id"],
                "org_id": membership["org_id"],
                "system_role": membership["system_role"],
                "status": membership["status"]
            }
        }

    def get_pending_invites(self, user_id: str):

        response = self.db.table("org_members").select("*").eq("user_id", user_id).eq("status", "invited").execute()
        if not response.data:
            return []

        invites = []
        for membership in response.data:
            org_response = self.db.table("organizations").select("*").eq("id", membership["org_id"]).execute()
            org = org_response.data[0] if org_response.data else None
            if not org:
                continue
            invites.append({
                "org": org,
                "membership": {
                    "user_id": membership["user_id"],
                    "org_id": membership["org_id"],
                    "system_role": membership["system_role"],
                    "status": membership["status"]
                }
            })

        return invites

    def get_membership(self, user_id: str, org_id: str):

        response = self.db.table("org_members").select("*").eq("org_id", org_id).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None

    def get_org(self, org_id: str):

        response = self.db.table("organizations").select("*").eq("id", org_id).execute()
        return response.data[0] if response.data else None

    def create_org(self, user_id: str, name: str):

        org_response = self.db.table("organizations").insert({"name": name}).execute()
        org = org_response.data[0]

        self.db.table("org_members").insert({
            "org_id": org["id"],
            "user_id": user_id,
            "system_role": "admin",
            "status": "active"
        }).execute()

        return self.get_org_for_user(user_id)

    def find_user_by_email(self, email: str):

        users = self.db.auth.admin.list_users()
        for user in users:
            if user.email and user.email.lower() == email.lower():
                return {"id": user.id, "email": user.email}
        return None

    def invite_member(self, org_id: str, admin_id: str, email: str, system_role: str):

        if system_role not in ("admin", "hr", "member"):
            system_role = "member"

        user = self.find_user_by_email(email)
        if not user:
            return "user_not_found", None

        existing = self.db.table("org_members").select("*").eq("org_id", org_id).eq("user_id", user["id"]).execute()
        if existing.data:
            self.db.table("org_members").update({
                "system_role": system_role,
                "status": "invited"
            }).eq("id", existing.data[0]["id"]).execute()
            return None, existing.data[0]["id"]

        response = self.db.table("org_members").insert({
            "org_id": org_id,
            "user_id": user["id"],
            "system_role": system_role,
            "status": "invited",
            "invited_by": admin_id
        }).execute()
        return None, response.data[0]["id"]

    def join_org(self, user_id: str, org_id: str):

        existing = self.db.table("org_members").select("*").eq("org_id", org_id).eq("user_id", user_id).execute()
        if existing.data:
            self.db.table("org_members").update({"status": "active"}).eq("id", existing.data[0]["id"]).execute()
        else:
            self.db.table("org_members").insert({
                "org_id": org_id,
                "user_id": user_id,
                "system_role": "member",
                "status": "active"
            }).execute()

        return self.get_org_for_user(user_id)

    def list_members(self, org_id: str):

        response = self.db.table("org_members").select("*").eq("org_id", org_id).order("created_at").execute()
        members = response.data or []
        if not members:
            return members

        user_ids = [m["user_id"] for m in members]
        profile_response = self.db.table("profiles").select("id, first_name, last_name").in_("id", user_ids).execute()
        profile_map = {p["id"]: p for p in (profile_response.data or [])}

        emails = {}
        try:
            users = self.db.auth.admin.list_users()
            for user in users:
                emails[user.id] = user.email
        except Exception as e:
            print(f"⚠️ Warning: Could not load member emails: {e}")

        for m in members:
            profile = profile_map.get(m["user_id"], {})
            m["first_name"] = profile.get("first_name", "")
            m["last_name"] = profile.get("last_name", "")
            m["email"] = emails.get(m["user_id"], "")

        return members

    def update_member(self, org_id: str, target_user_id: str, system_role: str = None, status: str = None):

        updates = {}
        if system_role is not None:
            updates["system_role"] = system_role
        if status is not None:
            updates["status"] = status
        if not updates:
            return None

        response = self.db.table("org_members").update(updates).eq("org_id", org_id).eq("user_id", target_user_id).execute()
        return response.data[0] if response.data else None

    def remove_member(self, org_id: str, target_user_id: str):

        response = self.db.table("org_members").delete().eq("org_id", org_id).eq("user_id", target_user_id).execute()
        return response.data[0] if response.data else None

state_db = SessionManager()
