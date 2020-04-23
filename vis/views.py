from django.shortcuts import render
from django.http import JsonResponse
from .models import Qubit

# Create your views here.
def index(request):
	return render(request, 'vis/index.html')