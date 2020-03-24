from django.db import models

class Qubit(models.Model):
  probability = models.FloatField()

  def __str__(self):
    return self.id