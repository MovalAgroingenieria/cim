# 2025 Moval Agroingeniería
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

{
    "name": "Complaints Channel",
    "summary": "Management of the complaints channel.",
    "version": "16.0.1.0.0",
    "category": "Complaints and Infringements Management",
    "website": "https://github.com/OCA/cim",
    "author": "Moval Agroingeniería, Odoo Community Association (OCA)",
    "license": "AGPL-3",
    "depends": [
        "contacts",
        "mail",
        "html_text",
        "website",
    ],
    "data": [
        "security/security.xml",
        "security/ir.model.access.csv",
        "data/ir_sequence_data.xml",
        "data/cim_type_data.xml",
        "data/cim_link_type_data.xml",
        "wizards/wizard_reject_view.xml",
        "wizards/wizard_resolve_view.xml",
        "wizards/wizard_data_view.xml",
        "views/cim_channel_menus.xml",
        "views/res_config_settings_view.xml",
        "views/cim_type_view.xml",
        "views/cim_view.xml",
        "views/cim_link_type_view.xml",
        "views/complainant_templates.xml",
        "reports/cim_tracking_code_report.xml",
        "reports/cim_communication_report.xml",
        "data/mail_template_data.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "cim_channel/static/src/css/cim_channel.css",
            "cim_channel/static/lib/channel_iconset/channel_iconset.css",
        ],
        "web.assets_frontend": [
            "cim_channel/static/src/js/button_send.js",
        ],
        "web.report_assets_common": [
            "cim_channel/static/lib/channel_iconset/channel_iconset.css",
        ],
    },
    "external_dependencies": {
        "python": ["pycryptodome"],
    },
    "installable": True,
    "post_init_hook": "post_init_hook",
    "uninstall_hook": "uninstall_hook",
    "application": False,
}
