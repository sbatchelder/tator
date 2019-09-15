import time

from django.core.management.base import BaseCommand
from django.core.management.base import CommandError

from main.util import updateProjectTotals

class Command(BaseCommand):
    help = "Updates project totals periodically."

    def handle(self, *args, **options):
        while True:
            updateProjectTotals()
            time.sleep(10)

