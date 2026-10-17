from django.db import models

class Document(models.Model):
    document_id = models.CharField(max_length=100, unique=True) # e.g. DOC-001
    project_id = models.CharField(max_length=100)
    file_name = models.CharField(max_length=255)
    file_url = models.TextField() # Base64 or media path
    category = models.CharField(max_length=100, default='Other')
    uploaded_by = models.CharField(max_length=100)
    upload_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['project_id', 'category'], name='doc_proj_cat_idx'),
            models.Index(fields=['upload_date'], name='doc_upload_idx'),
        ]

    def __str__(self):
        return f"{self.file_name} ({self.category}) for {self.project_id}"
