from django.db import models

class SurpriseInteraction(models.Model):
    CHOICES = [
        ("yes", "Yes"),
        ("no", "No"),
    ]

    session_key = models.CharField(max_length=40, blank=True)
    choice = models.CharField(max_length=10, choices=CHOICES)
    puzzle_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.choice.upper()} - {self.created_at:%Y-%m-%d %H:%M}"
