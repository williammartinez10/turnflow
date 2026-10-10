from backend.REST_API.DAO.admin_DAO import adminDAO, Admin
from fastapi import HTTPException

class adminHandler:
  def add_admin2(self, new_admin: Admin):
    # Validate required fields explicitly
    if not new_admin.email:
      raise HTTPException(status_code=401, detail="email is required")
    # Validate required fields explicitly
    if not new_admin.password:
      raise HTTPException(status_code=401, detail="password is required")
    return adminDAO().add_admin3(new_admin)

  def get_admin2(self, admin: Admin):
    return adminDAO().check_admin3(admin)

  def delete_admin2(self, admin: Admin):
    result = adminDAO().delete_admin3(admin)
    return {
      "message": "Admin " + Admin.email + " successfully popped",
      "admin": result
      }