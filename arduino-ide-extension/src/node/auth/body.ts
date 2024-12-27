export const body = `<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Arduino Account</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        html {
            height: 100%;
        }

        body {
            box-sizing: border-box;
            min-height: 100%;
            margin: 0;
            padding: 15px 30px;
            display: flex;
            flex-direction: column;
            color: white;
            font-family: "Segoe UI", "Helvetica Neue", "Helvetica", Arial, sans-serif;
            background-color: #2C2C32;
        }

        .branding {
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNDIiIGhlaWdodD0iMTg3Ljg5Ij48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMzE0LjIgOTYuMmMwLTM3LjgtMzEuOS02OC41LTcxLTY4LjUtMy42IDAtNy4zLjItMTAuOS44LTMwLjQgNC4zLTUwLjggMjYuMi02Mi4yIDQzLTExLjQtMTYuOC0zMS44LTM4LjctNjIuMi00My0zLjYtLjUtNy4zLS44LTEwLjktLjgtMzkuMiAwLTcxIDMwLjctNzEgNjguNXMzMS45IDY4LjUgNzEgNjguNWMzLjYgMCA3LjMtLjIgMTEtLjggMzAuNC00LjQgNTAuOC0yNi4zIDYyLjItNDMuMSAxMS40IDE2LjggMzEuOCAzOC43IDYyLjIgNDMuMSAzLjYuNSA3LjMuOCAxMSAuOCAzOC45IDAgNzAuOC0zMC43IDcwLjgtNjguNW0tMjA5LjggNDMuN2MtMi41LjQtNSAuNS03LjUuNS0yNS44IDAtNDYuNy0xOS45LTQ2LjctNDQuMkM1MC4yIDcxLjggNzEuMiA1MiA5NyA1MmMyLjUgMCA1IC4yIDcuNS41IDI4LjcgNC4xIDQ2LjIgMzIuNCA1Mi4yIDQzLjctNi4xIDExLjQtMjMuNyAzOS42LTUyLjMgNDMuN203OS4xLTQzLjdjNS45LTExLjMgMjMuNS0zOS42IDUyLjItNDMuNyAyLjUtLjMgNS0uNSA3LjUtLjUgMjUuOCAwIDQ2LjcgMTkuOSA0Ni43IDQ0LjIgMCAyNC40LTIxIDQ0LjItNDYuNyA0NC4yLTIuNSAwLTUtLjItNy41LS41LTI4LjctNC4xLTQ2LjMtMzIuNC01Mi4yLTQzLjciLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNNzcuMyA4OS41SDEyMHYxMy43SDc3LjN6bTE3MC42IDEzLjhoMTQuNFY4OS41aC0xNC40Vjc1LjFoLTEzLjh2MTQuNGgtMTQuNHYxMy44aDE0LjR2MTQuNGgxMy44em01Mi44LTYzLjljMC0zLjUgMi44LTYuNCA2LjItNi40IDMuNSAwIDYuMyAyLjkgNi4zIDYuNCAwIDMuNy0yLjggNi40LTYuMyA2LjQtMy40IDAtNi4yLTIuOS02LjItNi40em0xMS40IDBjMC0yLjktMi4yLTUuNC01LjItNS40cy01LjEgMi4yLTUuMSA1LjRjMCAzLjMgMi40IDUuNCA1LjEgNS40IDMgMCA1LjItMi4xIDUuMi01LjR6bS04LjItNGgzLjFjMi40IDAgMy4zIDEgMy4zIDIuNyAwIDEuMS0uNSAxLjktMS41IDIuM2wxLjUgM2gtMi4ybC0xLjEtMi43aC0xLjF2Mi43aC0ydi04em0yLjkgMy45Yy45IDAgMS40LS4zIDEuNC0xLjMgMC0uOS0uMy0xLjItMS40LTEuMmgtMXYyLjZsMS0uMXoiLz48L3N2Zz4=');
            background-size: 24px;
            background-repeat: no-repeat;
            background-position: left center;
            padding-left: 36px;
            font-size: 20px;
            letter-spacing: -0.04rem;
            font-weight: 400;
            color: white;
            text-decoration: none;
        }

        .message-container {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 30px;
        }

        .message {
            font-weight: 300;
            font-size: 1.4rem;
        }

        body.error .message {
            display: none;
        }

        body.error .error-message {
            display: block;
        }

        .error-message {
            display: none;
            font-weight: 300;
            font-size: 1.3rem;
        }

        .error-text {
            color: red;
            font-size: 1rem;
        }

        @font-face {
            font-family: 'Segoe UI';
            src: url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.eot"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.eot?#iefix") format("embedded-opentype");
            src: local("Segoe UI Light"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.woff2") format("woff2"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.woff") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.ttf") format("truetype"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/light/latest.svg#web") format("svg");
            font-weight: 200
        }

        @font-face {
            font-family: 'Segoe UI';
            src: url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.eot"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.eot?#iefix") format("embedded-opentype");
            src: local("Segoe UI Semilight"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.woff2") format("woff2"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.woff") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.ttf") format("truetype"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semilight/latest.svg#web") format("svg");
            font-weight: 300
        }

        @font-face {
            font-family: 'Segoe UI';
            src: url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.eot"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.eot?#iefix") format("embedded-opentype");
            src: local("Segoe UI"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.woff2") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.woff") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.ttf") format("truetype"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/normal/latest.svg#web") format("svg");
            font-weight: 400
        }

        @font-face {
            font-family: 'Segoe UI';
            src: url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.eot"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.eot?#iefix") format("embedded-opentype");
            src: local("Segoe UI Semibold"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.woff2") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.woff") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.ttf") format("truetype"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/semibold/latest.svg#web") format("svg");
            font-weight: 600
        }

        @font-face {
            font-family: 'Segoe UI';
            src: url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.eot"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.eot?#iefix") format("embedded-opentype");
            src: local("Segoe UI Bold"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.woff2") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.woff") format("woff"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.ttf") format("truetype"), url("https://c.s-microsoft.com/static/fonts/segoe-ui/west-european/bold/latest.svg#web") format("svg");
            font-weight: 700
        }
    </style>
</head>

<body>
    <a class="branding" href="https://create.arduino.cc/">
        Arduino Account
    </a>
    <div class="message-container">
        <div class="message">
            You are signed-in. You can close this browser window.
        </div>
        <div class="error-message">
            An error occurred while signing in:
            <div class="error-text"></div>
        </div>
    </div>
    <script>
        var search = window.location.search;
        var error = (/[?&^]error=([^&]+)/.exec(search) || [])[1];
        if (error) {
            document.querySelector('.error-text').textContent = decodeURIComponent(error);
            document.querySelector('body').classList.add('error');
        }

        window
    </script>
</body>

</html>
`;
