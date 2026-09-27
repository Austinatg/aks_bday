from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("aksbirthdaywish/", views.birthday_wish, name="birthday_wish"),
    path("waititsnotdone/", views.wait_its_not_done, name="wait_its_not_done"),
    path("aksgamingimg/", views.aks_gaming_image, name="aksgamingimg"),
    path("akssurfingatvarkala/", views.aks_surfing_at_varkala, name="akssurfingatvarkala"),
    path("aksbhanginpondi/", views.aks_bhang_in_pondi, name="aksbhanginpondi"),
    path("aksredwedding/", views.aks_red_wedding, name="aksredwedding"),
    path("aksfinalbirthday/", views.aks_final_birthday, name="aksfinalbirthday"),
    path("api/record-choice/", views.record_choice, name="record_choice"),
]
