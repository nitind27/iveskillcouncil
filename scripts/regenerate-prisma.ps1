# Stop any process using Prisma, then regenerate
# Run this after stopping npm run dev (Ctrl+C)
Write-Host "Regenerating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "Done! Now run: npm run dev"
} else {
    Write-Host "Failed. Make sure npm run dev is stopped (Ctrl+C), then try again."
}
