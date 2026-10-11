from backend.REST_API.DAO.staff_DAO import staffDAO, Staff
from backend.REST_API.DAO.admin_DAO import adminDAO
from fastapi import HTTPException
from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


class staffHandler:
  def add_staff2(self, new_staff: Staff):
    new_staff.full_name = new_staff.full_name.strip()
    new_staff.email = new_staff.email.strip().lower()

    # Validate required fields explicitly
    if not new_staff.full_name:
      raise HTTPException(status_code=400, detail="full_name is required")

    if not new_staff.email:
      raise HTTPException(status_code=400, detail="email is required")

    if not new_staff.password.strip():
      raise HTTPException(status_code=400, detail="password is required")

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
    account = staffDAO().get_staff3(email.strip().lower())

    if account is None:
      return None

    # Verify the entered password against the stored hash.
    if not password_hash.verify(password, account["password"]):
      return None

    del account["password"]
    account["role"] = "staff"
    return account
  