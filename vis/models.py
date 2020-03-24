from django.db import models

class Qubit(models.Model):
  probability = models.FloatField()

  def __str__(self):
    return "id %d probability %.3f" % (self.id, self.probability)