from backend.REST_API.DAO.service_DAO import serviceDAO, Service
from fastapi import HTTPException


class serviceHandler:

    def add_service2(self, new_service: Service, account: dict | None):
        # Require an Admin session before creating a service.
        if account is None:
            raise HTTPException(status_code=401, detail="Not logged in.")

        if account.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required.")

        # Tie the service to the currently logged-in Admin.
        new_service.admin_id = account["admin_id"]

        # Validate the required service name.
        if not new_service.service_name.strip():
            raise HTTPException(status_code=400, detail="service_name is required")

        new_service.service_name = new_service.service_name.strip()

        return serviceDAO().add_service3(new_service)

    def get_service_list2(self, account: dict | None):
        if account is None:
            raise HTTPException(
                status_code=401,
                detail="Not logged in."
            )

        if account.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required."
            )

        return serviceDAO().get_service_list3(
            account["admin_id"]
        )

    # ===== Service Editing =====

    def update_service2(self, updated_service: Service, account: dict | None):
        # Require an Admin session.
        if account is None:
            raise HTTPException(status_code=401, detail="Not logged in.")

        if account.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required.")

        # Use the logged-in admin instead of trusting admin_id from the frontend.
        updated_service.admin_id = account["admin_id"]

        if updated_service.service_id is None:
            raise HTTPException(status_code=400, detail="service_id is required")

        if not updated_service.service_name.strip():
            raise HTTPException(status_code=400, detail="service_name is required")

        updated_service.service_name = updated_service.service_name.strip()

        return serviceDAO().update_service3(updated_service)

    # ===== End Service Editing =====

    def set_service_active2(
            self,
            service_id: int,
            make_active: bool,
            account: dict | None
    ):
        if account is None:
            raise HTTPException(status_code=401, detail="Not logged in.")

        if account.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required.")

        return serviceDAO().set_service_active3(
            service_id,
            account["admin_id"],
            make_active
        )

    def delete_service2(
            self,
            service_id: int,
            account: dict | None
    ):
        if account is None:
            raise HTTPException(
                status_code=401,
                detail="Not logged in."
            )

        if account.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required."
            )

        return serviceDAO().delete_service3(
            service_id,
            account["admin_id"]
        )