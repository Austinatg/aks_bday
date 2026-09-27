from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .models import SurpriseInteraction

def home(request):
    if not request.session.session_key:
        request.session.create()
    return render(request, "surprise/home.html")


def birthday_wish(request):
    return render(request, "surprise/birthday_wish.html")


def wait_its_not_done(request):
    return render(request, "surprise/wait_its_not_done.html")


def aks_gaming_image(request):
    return render(request, "surprise/aks_gaming_image.html")


def aks_surfing_at_varkala(request):
    return render(request, "surprise/aks_surfing_at_varkala.html")


def aks_bhang_in_pondi(request):
    return render(request, "surprise/aks_bhang_in_pondi.html")


def aks_red_wedding(request):
    return render(request, "surprise/aks_red_wedding.html")


def aks_final_birthday(request):
    return render(request, "surprise/aks_final_birthday.html")

@require_POST
def record_choice(request):
    choice = request.POST.get("choice", "").lower()
    puzzle_completed = request.POST.get("puzzle_completed") == "true"

    if choice not in {"yes", "no"}:
        return JsonResponse({"success": False, "error": "Invalid choice."}, status=400)

    if not request.session.session_key:
        request.session.create()

    interaction = SurpriseInteraction.objects.create(
        session_key=request.session.session_key,
        choice=choice,
        puzzle_completed=puzzle_completed,
    )

    return JsonResponse({
        "success": True,
        "id": interaction.id,
        "choice": choice,
    })
