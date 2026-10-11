from backend.REST_API.DAO.staff_privilege_DAO import staff_privilegeDAO, Staff_Privilege
from fastapi import HTTPException


class staff_privilegeHandler:
  def add_staff_privilege2(self, new_staff_privilege: Staff_Privilege):
    # Validate required fields explicitly.
    if not new_staff_privilege.staff_privilege:
      raise HTTPException(status_code=401, detail="staff_privilege is required")

    # A privilege may start without any staff assigned.
    return staff_privilegeDAO().add_staff_privilege3(new_staff_privilege)

  def get_staff_privilege_list2(self):
    return staff_privilegeDAO().get_staff_privilege_list3()

  def get_with_staff_privilege_staff_list2(self, staff_privilege: str):
    return staff_privilegeDAO().get_with_staff_privilege_staff_list3(
      staff_privilege
    )

  def delete_staff_privilege_staff2(self, staff_privilege: str):
    result = staff_privilegeDAO().delete_staff_privilege3(staff_privilege)
    return {
      "message": "Staff Privilege " + staff_privilege + " successfully deleted",
      "staff_privilege": result
    }