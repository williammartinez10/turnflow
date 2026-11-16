import threading
import requests

class stressTestWrapper:
  global url
  url = "http://127.0.0.1:8000/database/customer/add_customer"
  def Thread_func(phone_number: str, queue_code: str):
    customer_bot = {
              "phone_number": phone_number,
              "queue_code": queue_code,
    }
    response = requests.post(url, json=customer_bot, timeout=60)
    response.raise_for_status()
    print(response.status_code)
    print(response.json())


threads = []
phone_num_gen = 111
customer= {
          "phone_number": str(phone_num_gen) + "-" + str(phone_num_gen) + "-" + str(phone_num_gen)+ "5",
          "queue_code": "games division",
}
for i in range(40):
  customer["phone_number"] = str(phone_num_gen) + "-" + str(phone_num_gen) + "-" + str(phone_num_gen)+ "5"
  phone_num_gen += 1
  c_thread = threading.Thread(target=stressTestWrapper.Thread_func, kwargs=customer)
  threads.append(c_thread)
  c_thread.start()

for t in threads:
  t.join()

print("All c_threads finished")