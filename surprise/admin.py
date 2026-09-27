from django.contrib import admin
from .models import SurpriseInteraction

@admin.register(SurpriseInteraction)
class SurpriseInteractionAdmin(admin.ModelAdmin):
    list_display = ("choice", "puzzle_completed", "created_at", "session_key")
    list_filter = ("choice", "puzzle_completed", "created_at")
    readonly_fields = ("created_at",)
