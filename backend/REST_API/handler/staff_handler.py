from backend.REST_API.DAO.staff_DAO import staffDAO, Staff
from fastapi import HTTPException

class staffHandler:
  def add_staff2(self, new_staff: Staff):
    # Validate required fields explicitly
    if not new_staff.email:
      raise HTTPException(status_code=401, detail="email is required")
    # Validate required fields explicitly
    if not new_staff.password:
      raise HTTPException(status_code=401, detail="password is required")
    return staffDAO().add_staff3(new_staff)

  def get_staff2(self, staff: Staff):
    return staffDAO().check_staff3(staff)

  def delete_staff2(self, staff: Staff):
    result = staffDAO().delete_staff3(staff)
    return {
      "message": "Staff " + Staff.email + " successfully deleted",
      "staff": result
      }