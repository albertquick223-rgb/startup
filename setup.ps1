$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

function Test-Command($name) {
    return Get-Command $name -ErrorAction SilentlyContinue -CommandType Application, Cmdlet
}

if (-not (Test-Command git)) {
    Write-Host "Git tidak ditemukan. Silakan install Git terlebih dahulu: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

git init | Out-Null
if (-not (Test-Path .git)) {
    Write-Host "Gagal menginisialisasi repository Git." -ForegroundColor Red
    exit 1
}

git add .
git commit -m "Initial CryptoStake frontend" | Out-Null

if (Test-Command gh) {
    Write-Host "GitHub CLI ditemukan." -ForegroundColor Green
    $repoName = Read-Host "Masukkan nama repo GitHub yang akan dibuat"
    if ($repoName) {
        gh repo create $repoName --public --source . --remote origin --push
        Write-Host "Repo GitHub dibuat dan dipush." -ForegroundColor Green
    }
} else {
    Write-Host "GitHub CLI tidak ditemukan. Silakan buat repository secara manual di GitHub." -ForegroundColor Yellow
    Write-Host "Jika sudah punya URL repo, jalankan perintah berikut:" -ForegroundColor Gray
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
}

Write-Host "Jika menggunakan Vercel otomatis, tambahkan secret GitHub:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID" -ForegroundColor Green
Write-Host "File workflow GitHub Actions sudah tersedia di .github/workflows/vercel-deploy.yml." -ForegroundColor Green
Write-Host "Setup Git lokal selesai. Gunakan README.md untuk panduan Supabase dan Vercel." -ForegroundColor Green
