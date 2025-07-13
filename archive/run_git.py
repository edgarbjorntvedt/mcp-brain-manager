import subprocess
import os

os.chmod('/Users/bard/Code/mcp-brain-manager/git_update.sh', 0o755)
os.chdir('/Users/bard/Code/mcp-brain-manager')
result = subprocess.run(['./git_update.sh'], capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)
