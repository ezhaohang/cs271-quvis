from django.shortcuts import render
from .models import Qubit

# Create your views here.
def index(request):
	qubits = Qubit.objects.all()
	return render(request, 'vis/index.html', {'qubits': qubits})