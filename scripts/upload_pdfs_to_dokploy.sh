#!/bin/bash
# Upload grade 2 PDFs to Dokploy volume
# Run this on Dokploy server or via Dokploy Terminal

set -e

VOLUME_PATH="/var/lib/dokploy/volumes/vyvy-lesson-pdfs"
CONTAINER_DATA="/app/backend/data/lesson_pdfs"

echo "=== AI Kids Buddy - PDF Upload Script ==="
echo ""

# Check if volume exists
if [ ! -d "$VOLUME_PATH" ]; then
    echo "ERROR: Volume not found at $VOLUME_PATH"
    echo "Check Dokploy UI for correct volume path"
    exit 1
fi

echo "Volume found at: $VOLUME_PATH"
echo ""

# Create grade directories
for grade in 1 2 3 4 5; do
    mkdir -p "$VOLUME_PATH/grade_$grade"
done

echo "Grade directories created."
echo ""

# Method 1: Copy from local machine via SCP
# Run this on your LOCAL machine (Windows PowerShell):
# scp -r backend/data/lesson_pdfs/grade_2/* user@dokploy-server:$VOLUME_PATH/grade_2/

# Method 2: If PDFs are in the container already
echo "If PDFs are in the container, run:"
echo "docker cp <container_id>:/app/backend/data/lesson_pdfs/grade_2/ $VOLUME_PATH/grade_2/"
echo ""

# Method 3: Download from a URL (if you have the PDFs hosted)
# wget -r -np -nH --cut-dirs=4 -R "index.html*" https://your-server.com/lesson_pdfs/grade_2/ -P $VOLUME_PATH/grade_2/

echo "=== Verification ==="
echo "Checking volume contents..."
ls -la "$VOLUME_PATH/"
echo ""
echo "Grade 2 files:"
ls -la "$VOLUME_PATH/grade_2/" 2>/dev/null | head -20
echo ""
echo "Total files in grade_2:"
find "$VOLUME_PATH/grade_2/" -name "*.pdf" 2>/dev/null | wc -l
echo ""
echo "Done!"
