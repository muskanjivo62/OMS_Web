import requests
from django.conf import settings


class HANAServiceLayer:
    def __init__(self):
        self.base_url = settings.HANA_SERVICE_LAYER_URL
        self.username = settings.HANA_USERNAME
        self.password = settings.HANA_PASSWORD
        self.company_db = settings.HANA_COMPANY_DB
        self.session = requests.Session()
        self.login()

    def login(self):
        login_data = {
            "UserName": self.username,
            "Password": self.password,
            "CompanyDB": self.company_db
        }

        response = self.session.post(
            f"{self.base_url}/Login",
            json=login_data,
            verify=False  # if SSL issue
        )

        if response.status_code != 200:
            raise Exception("HANA Login Failed")

    def post(self, endpoint, payload):
        response = self.session.post(
            f"{self.base_url}/{endpoint}",
            json=payload,
            verify=False
        )

        if response.status_code not in [200, 201]:
            raise Exception(response.text)

        return response.json()
