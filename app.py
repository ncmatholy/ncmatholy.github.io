from hashlib import sha256
from pathlib import Path

from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder="output/static")
app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True

PAGES = ["about", "staff", "archive", "contact"]


@app.template_global()
def static_asset(filename):
    """Keep returning visitors from seeing outdated styles or illustrations."""
    version = sha256((Path(app.static_folder) / filename).read_bytes()).hexdigest()[:12]
    return f"/static/{filename}?v={version}"


def serve_template(file):
    return render_template(f"{file}.j2")


app.add_url_rule("/", "index", serve_template, defaults={"file": "index"})
app.add_url_rule("/index.html", "index_html", serve_template, defaults={"file": "index"})
for page in PAGES:
    app.add_url_rule(
        f"/{page}", page, serve_template, defaults={"file": page}, strict_slashes=False
    )
    app.add_url_rule(
        f"/{page}.html", f"{page}_html", serve_template, defaults={"file": page}
    )


@app.route("/favicon.ico", defaults={"filename": "favicon.ico"})
@app.route("/favicon-96.png", defaults={"filename": "favicon-96.png"})
def favicon(filename):
    return send_from_directory("output", filename)


@app.errorhandler(404)
def not_found(_):
    return render_template("404.j2"), 404


def build_site():
    """Build both existing .html URLs and directory URLs for GitHub Pages."""
    output = Path(__file__).resolve().parent / "output"
    output.mkdir(exist_ok=True)
    with app.app_context():
        for page in ["index", "404"] + PAGES:
            html = render_template(f"{page}.j2")
            (output / f"{page}.html").write_text(html, encoding="utf-8")
            if page in PAGES:
                directory = output / page
                directory.mkdir(exist_ok=True)
                (directory / "index.html").write_text(html, encoding="utf-8")
            print(f"Rendered {page}.html")


if __name__ == "__main__":
    build_site()
