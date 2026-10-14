from backend.REST_API.DAO.staff_DAO import staffDAO, Staff
from backend.REST_API.DAO.admin_DAO import adminDAO
from fastapi import HTTPException
from pwdlib import PasswordHash
import re
import unicodedata


password_hash = PasswordHash.recommended()


class staffHandler:
  def add_staff2(self, new_staff: Staff):
    """
    Validate signup data and create a staff account with a password hash.
    
    Normalize the name and email, check required fields and signup formats,
    enforce password rules, and reject emails registered under either role.
    The original password value is hashed without trimming or normalizing it.
    """
    new_staff.full_name = new_staff.full_name.strip()
    new_staff.email = new_staff.email.strip().lower()

    # Validate required fields explicitly
    if not new_staff.full_name:
      raise HTTPException(status_code=400, detail="full_name is required")

    if not new_staff.email:
      raise HTTPException(status_code=400, detail="email is required")

    if not new_staff.password.strip():
      raise HTTPException(status_code=400, detail="password is required")

    # Check for at least two name parts; this validates format, not identity.
    if len(new_staff.full_name.split()) < 2:
      raise HTTPException(status_code=400, detail="Enter your first and last name.")

    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", new_staff.email) is None:
      raise HTTPException(status_code=400, detail="Enter an email address such as name@example.com.")

    password = new_staff.password
    # Match the frontend Unicode categories: Lu (uppercase), Nd (digit),
    # and P/S (punctuation or symbol). Spaces do not satisfy the symbol rule.
    password_categories = [unicodedata.category(character) for character in password]

    if (len(password) < 8 or 
        "Lu" not in password_categories or 
        "Nd" not in password_categories or 
        not any(category.startswith(("P", "S"))for category in password_categories)
    ):
      raise HTTPException(
        status_code=400,
        detail=(
          "Password must contain at least 8 characters, "
          "an uppercase letter, a number, and a symbol."
        )
      )
    
    dao = staffDAO()

    # Check both account types because they share the login form.
    if (
      dao.get_staff3(new_staff.email) is not None
      or adminDAO().get_admin3(new_staff.email) is not None
    ):
      raise HTTPException(
        status_code=409,
        detail="Email is already registered."
      )

    # Hash the password before storing it in the database.
    hashed_password = password_hash.hash(new_staff.password)
    return dao.add_staff3(new_staff, hashed_password)

  def get_staff2(self, email: str, password: str):
    """
    Verify credentials and return a staff account without its password hash.
    
    Return None when the account is absent or the password does not match.
    The added role identifies the account for the login/session response.
    """
    account = staffDAO().get_staff3(email.strip().lower())

    if account is None:
      return None

    # Verify the entered password against the stored hash.
    if not password_hash.verify(password, account["password"]):
      return None

    del account["password"]
    account["role"] = "staff"
    return account

  def delete_staff2(self, staff: Staff):
    if staff.staff_id is None:
      raise HTTPException(status_code=400, detail="staff_id is required")

    result = staffDAO().delete_staff3(staff)
    return {
      "message": "Staff " + result["email"] + " successfully deleted",
      "staff": result
    }