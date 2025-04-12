export interface BaseTemplateData {
    organizationName: string;
    organizationLogo: string;
    primaryColor: string;
    secondaryColor: string;
}

export const getBaseTemplate = (data: BaseTemplateData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.organizationName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: ${data.primaryColor};
        }
        .logo {
            max-width: 200px;
            height: auto;
        }
        .content {
            padding: 30px 20px;
            background-color: #ffffff;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: ${data.secondaryColor};
            color: #ffffff;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${data.primaryColor};
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${data.organizationLogo}" alt="${data.organizationName} Logo" class="logo">
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.organizationName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
