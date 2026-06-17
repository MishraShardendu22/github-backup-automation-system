Add deps in pyproejct.toml and install using = uv sync
run the application using = uv run uvicorn main:app --reload
use this to run server 


# now we can run the app uisng main.py file
# no need to run uvicorn command in terminal, just run this file and it will start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

i dont want to use this because i dont wannna isntal py deps in my machien only in venv i isntall them


file naming is strict 
from clients.go_backend import GoBackendClient

clients directory should be in the same directory as main.py file and it should contain go_backend.py file which contains GoBackendClient class 