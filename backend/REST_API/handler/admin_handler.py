from backend.REST_API.DAO.admin_DAO import adminDAO, Admin
from backend.REST_API.DAO.staff_DAO import staffDAO
from fastapi import HTTPException
from pwdlib import PasswordHash
import re
import unicodedata


password_hash = PasswordHash.recommended()


class adminHandler:
  def add_admin2(self, new_admin: Admin):
    new_admin.full_name = new_admin.full_name.strip()
    new_admin.email = new_admin.email.strip().lower()
    new_admin.organization_name = new_admin.organization_name.strip()

    # Validate required fields explicitly
    if not new_admin.full_name:
      raise HTTPException(status_code=400, detail="full_name is required")

    if not new_admin.email:
      raise HTTPException(status_code=400, detail="email is required")

    if not new_admin.password.strip():
      raise HTTPException(status_code=400, detail="password is required")

    if not new_admin.organization_name:
      raise HTTPException(status_code=400, detail="organization_name is required")

    if len(new_admin.full_name.split()) < 2:
      raise HTTPException(status_code=400, detail="Enter your first and last name.")

    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", new_admin.email) is None:
      raise HTTPException(status_code=400, detail="Enter an email address such as name@example.com.")

    password = new_admin.password
    password_categories = [unicodedata.category(character) for character in password]

    if (len(password) < 8 or 
        "Lu" not in password_categories or 
        "Nd" not in password_categories or 
        not any(category.startswith(("P", "S")) for category in password_categories
      )
    ):
      raise HTTPException(
        status_code=400,
        detail=(
          "Password must contain at least 8 characters, "
          "an uppercase letter, a number, and a symbol."
        )
      )
    
    dao = adminDAO()

    # Check both account types because they share the login form.
    if (
      dao.get_admin3(new_admin.email) is not None
      or staffDAO().get_staff3(new_admin.email) is not None
    ):
      raise HTTPException(
        status_code=409,
        detail="Email is already registered."
      )

    # Hash the password before storing it in the database.
    hashed_password = password_hash.hash(new_admin.password)
    return dao.add_admin3(new_admin, hashed_password)

  def get_admin2(self, email: str, password: str):
    account = adminDAO().get_admin3(email.strip().lower())

    if account is None:
      return None

    # Verify the entered password against the stored hash.
    if not password_hash.verify(password, account["password"]):
      return None

    del account["password"]
    account["role"] = "admin"
    return account

  def delete_admin2(self, admin: Admin):
    if admin.admin_id is None:
      raise HTTPException(status_code=400, detail="admin_id is required")

    result = adminDAO().delete_admin3(admin)
    return {
      "message": "Admin " + result["email"] + " successfully deleted",
      "admin": result
    }