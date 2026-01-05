from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder="output/static")

PAGES = ["about", "staff", "archive"]


def serve_template(file):
    return render_template(f"{file}.j2")


app.add_url_rule("/", "index", serve_template, defaults={"file": "index"})
for page in PAGES:
    app.add_url_rule(f"/{page}", page, serve_template, defaults={"file": page})


@app.route("/favicon.ico")
def favicon():
    return send_from_directory("output", "favicon.ico")


@app.errorhandler(404)
def not_found(_):
    return render_template("404.j2"), 404


if __name__ == "__main__":
    with app.app_context():
        for page in ["index", "404"] + PAGES:
            with open(f"output/{page}.html", "w") as f:
                f.write(render_template(f"{page}.j2"))
            print(f"Rendered {page}.html")
