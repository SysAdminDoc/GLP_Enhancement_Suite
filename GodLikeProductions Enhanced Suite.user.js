// ==UserScript==
// @name         GodLikeProductions Enhanced Suite
// @namespace    https://github.com/SysAdminDoc/GLP_Enhancement_Suite
// @version      4.2.0.20250802
// @description  Hides threads, blocks ads, bypasses nags, provides infinite scrolling, and a modern UI with extensive features for GodLikeProductions.
// @author       Matthew Parker
// @match        https://www.godlikeproductions.com/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://update.greasyfork.org/scripts/460834/GodLikeProductions%20Enhanced%20Suite.user.js
// @updateURL    https://update.greasyfork.org/scripts/460834/GodLikeProductions%20Enhanced%20Suite.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // --- State & Configuration ---
    let isLoadingNextPage = false;
    let autopagerObserver;

    let config = {
        // General
        autopager: GM_getValue('autopager', true),
        adBlocker: GM_getValue('adBlocker', true),
        bypassNag: GM_getValue('bypassNag', true),
        // Layout & Hiding
        hidePinnedThreads: GM_getValue('hidePinnedThreads', true),
        manualThreadHiding: GM_getValue('manualThreadHiding', true),
        sortByNew: GM_getValue('sortByNew', false),
        hideBanner: GM_getValue('hideBanner', true),
        hideFooter: GM_getValue('hideFooter', true),
        hideRelatedThreads: GM_getValue('hideRelatedThreads', true),
        // Declutter
        declutterTopNav: GM_getValue('declutterTopNav', false),
        declutterThreadNav: GM_getValue('declutterThreadNav', false),
        declutterPolls: GM_getValue('declutterPolls', true),
        declutterLastEdit: GM_getValue('declutterLastEdit', true),
        declutterSignatures: GM_getValue('declutterSignatures', true),
        declutterReportLinks: GM_getValue('declutterReportLinks', true),
        hidePageTopLinks2: GM_getValue('hidePageTopLinks2', false),
        hideTabNav: GM_getValue('hideTabNav', false),
        hideThreadTitle: GM_getValue('hideThreadTitle', false),
        hideRightPanelBox: GM_getValue('hideRightPanelBox', false),
        hideThreadsHeader: GM_getValue('hideThreadsHeader', false),
        // UX & Theme
        theme: GM_getValue('theme', 'saas-dark'),
        roundify: GM_getValue('roundify', false),
        squarify: GM_getValue('squarify', false),
        collapsibleQuotes: GM_getValue('collapsibleQuotes', true),
        collapseQuotesByDefault: GM_getValue('collapseQuotesByDefault', false),
        // Data
        hiddenThreads: JSON.parse(GM_getValue('hiddenThreads', '[]'))
    };

    function saveConfig() {
        for (const key in config) {
            if (key !== 'hiddenThreads') {
                GM_setValue(key, config[key]);
            }
        }
        GM_setValue('hiddenThreads', JSON.stringify(config.hiddenThreads));
    }

    // --- Professional Styling (CSS) ---
    GM_addStyle(`
        /* --- Font --- */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* --- Theme Definitions --- */
        body[data-theme='saas-dark'] {
            --bg-primary: #101010; --bg-secondary: #181818; --bg-tertiary: #222222;
            --text-primary: #EAEAEA; --text-secondary: #A0A0A0; --text-tertiary: #6B6B6B;
            --border-primary: #333333; --border-secondary: #252525;
            --accent-primary: #007BFF; --accent-secondary: #0056b3;
            --action-danger: #E53E3E; --action-danger-hover: #C53030;
            --action-success: #38A169;
            --shadow-sm: rgba(0, 0, 0, 0.2) 0px 2px 4px; --shadow-md: rgba(0, 0, 0, 0.4) 0px 5px 15px;
        }
        body[data-theme='cappuccino-mocha-dark'] {
            --bg-primary: #1E1E2E; --bg-secondary: #313244; --bg-tertiary: #45475A;
            --text-primary: #C6C8D1; --text-secondary: #A6ADC8; --text-tertiary: #7F849C;
            --border-primary: #585B70; --border-secondary: #45475A;
            --accent-primary: #89B4FA; --accent-secondary: #74C7EC;
            --action-danger: #F38BA8; --action-danger-hover: #E67E80;
            --action-success: #A6E3A1;
            --shadow-sm: rgba(0, 0, 0, 0.2) 0px 2px 4px; --shadow-md: rgba(0, 0, 0, 0.4) 0px 5px 15px;
        }
        body[data-theme='clean-light'] {
            --bg-primary: #FFFFFF; --bg-secondary: #F7F7F7; --bg-tertiary: #EAEAEA;
            --text-primary: #222222; --text-secondary: #555555; --text-tertiary: #888888;
            --border-primary: #E0E0E0; --border-secondary: #D0D0D0;
            --accent-primary: #007BFF; --accent-secondary: #0056b3;
            --action-danger: #E53E3E; --action-danger-hover: #C53030;
            --action-success: #38A169;
            --shadow-sm: rgba(0, 0, 0, 0.05) 0px 2px 4px; --shadow-md: rgba(0, 0, 0, 0.1) 0px 5px 15px;
        }

        /* --- Base & Layout --- */
        body { font-family: 'Inter', sans-serif; background: var(--bg-primary) !important; color: var(--text-primary) !important; line-height: 1.6; transition: background 0.3s ease, color 0.3s ease; }
        #sitewrap, #wrap_in, body, html { width: 100% !important; max-width: 100% !important; min-width: auto !important; box-sizing: border-box; overflow-x: hidden; background: transparent !important; }
        #content-wrap, .main-content-box { width: 95% !important; max-width: 1600px !important; margin: 0 auto !important; }
        #header { position: fixed; top: 0; left: 0; width: 100%; z-index: 10001; transition: top 0.4s ease-in-out; border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary); }

        /* Move pagetoplinks2 to the left */
        .topnav { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        ul.pagetoplinks2 { order: -1; margin-left: 0 !important; }

        /* --- Header Handle & Integrated Settings Button --- */
        #header-handle { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: auto; height: 35px; background: var(--bg-tertiary); color: var(--text-secondary); text-align: center; border-radius: 0 0 12px 12px; z-index: 10002; box-shadow: var(--shadow-md); transition: all 0.3s ease; display: flex; align-items: center; padding: 0 10px; }
        #homepage-link { display:flex; align-items: center; gap: 8px; padding: 0 15px; font-size: 13px; user-select: none; height: 100%; color: var(--text-secondary); text-decoration: none !important; }
        #homepage-link:hover { color: var(--text-primary); }
        #open-settings-btn { background: transparent; border: none; border-left: 1px solid var(--border-primary); height: 100%; padding: 0 12px; cursor: pointer; line-height: 0; }
        #open-settings-btn:hover svg { fill: var(--accent-primary); }
        #open-settings-btn svg { width: 20px; height: 20px; fill: var(--text-secondary); transition: all 0.2s ease; }
        #open-settings-btn:hover svg { transform: rotate(25deg); }

        /* --- Settings Panel --- */
        #settings-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95); width: 800px; max-width: 95%; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 16px; box-shadow: var(--shadow-md); z-index: 10004; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease; display: flex; flex-direction: column; }
        #settings-panel.visible { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
        .settings-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; background: var(--bg-secondary); border-radius: 16px 16px 0 0; border-bottom: 1px solid var(--border-primary); }
        .settings-header h2 { margin: 0; font-size: 22px; color: var(--text-primary); display: flex; align-items: center; gap: 12px; font-weight: 600; }
        .settings-header svg { fill: var(--accent-primary); width: 24px; height: 24px; }
        #close-settings { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 50%; line-height: 0; }
        #close-settings svg { width: 20px; height: 20px; fill: var(--text-secondary); transition: fill 0.2s ease, transform 0.3s ease; }
        #close-settings:hover svg { fill: var(--action-danger); transform: rotate(90deg); }
        .settings-content { padding: 25px; display: flex; flex-direction: column; gap: 15px; max-height: 75vh; overflow-y: auto; }
        .settings-section-header { font-size: 18px; color: var(--accent-primary); border-bottom: 1px solid var(--border-primary); padding-bottom: 10px; margin: 15px 0 5px 0; font-weight: 600; }
        .setting-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-secondary); }
        .setting-row label { font-size: 16px; color: var(--text-primary); }
        .setting-row small { color: var(--text-secondary); grid-column: 1 / 2; margin-top: -10px; }
        .switch { position: relative; display: inline-block; width: 52px; height: 28px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-tertiary); transition: 0.3s; border-radius: 28px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: 0.3s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--accent-primary); }
        input:checked + .slider:before { transform: translateX(24px); }

        /* --- Buttons --- */
        .glp-btn { background-color: var(--accent-primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-weight: 500; font-size: 14px; }
        .glp-btn:hover { background-color: var(--accent-secondary); box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); }
        .glp-btn.danger { background-color: var(--action-danger); }
        .glp-btn.danger:hover { background-color: var(--action-danger-hover); box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3); }

        /* --- Theme Selector --- */
        .theme-selector { display: flex; gap: 10px; }
        .theme-option { cursor: pointer; padding: 10px; border-radius: 8px; border: 2px solid var(--border-primary); transition: all 0.2s ease; }
        .theme-option.selected { border-color: var(--accent-primary); background-color: var(--bg-secondary); }
        .theme-option span { display: block; width: 40px; height: 20px; border-radius: 4px; }
        .theme-option[data-theme-name="saas-dark"] span { background: #181818; }
        .theme-option[data-theme-name="cappuccino-mocha-dark"] span { background: #313244; }
        .theme-option[data-theme-name="clean-light"] span { background: #F7F7F7; border: 1px solid #E0E0E0;}

        /* --- Toast Notification --- */
        #toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translate(-50%, 150px); background: var(--bg-tertiary); color: var(--text-primary); padding: 16px 32px; border-radius: 12px; box-shadow: var(--shadow-md); z-index: 10005; opacity: 0; visibility: hidden; transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); font-size: 16px; border-left: 4px solid var(--action-success); }
        #toast-notification.show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }

        /* --- Feature Specific Styles --- */
        .glp-suite-hidden-thread { display: none !important; }
        .glp-suite-hide-cell { width: 40px; text-align: center; }
        .glp-suite-hide-btn { cursor: pointer; font-size: 10px; color: var(--text-tertiary); border: 1px solid var(--border-primary); padding: 2px 5px; border-radius: 4px; transition: all 0.2s ease; }
        .glp-suite-hide-btn:hover { color: white; background: var(--action-danger); border-color: var(--action-danger); }
        #thread-controls { margin: 15px 0; padding: 15px; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
        .glp-loading-indicator { text-align: center; font-weight: bold; color: var(--text-secondary); padding: 40px; background: var(--bg-secondary); border-radius: 12px; margin: 20px 0; }

        /* Collapsible Quotes */
        .quote-toggle { margin-bottom: 5px; }
        .quote-toggle-btn { cursor: pointer; background: var(--bg-tertiary); color: var(--text-secondary); padding: 4px 10px; border-radius: 6px; font-size: 12px; display: inline-block; user-select: none; transition: all 0.2s ease; border: 1px solid var(--border-primary); }
        .quote-toggle-btn:hover { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
        div.quotei.glp-collapsed { max-height: 25px; overflow: hidden; opacity: 0.6; padding-top: 0 !important; padding-bottom: 0 !important; border-left-width: 3px; border-left-style: dotted; }
        div.quotei { transition: max-height 0.4s ease-out, opacity 0.4s ease, padding 0.4s ease; background-color: var(--bg-secondary) !important; border-color: var(--accent-primary) !important; }
        div.quoteo { background: transparent !important; border-left: 3px solid var(--accent-primary) !important; }

        /* Site element theming */
        .hdr_banner, .hdr_top, #rightpanel_inner, .footer, .sitestats, .sitestats td, table.threads th, form[action*="/bbs/vote.php"], .tabnav, .tabnav li, .tabnav a, table.msg td.nav, table.msg td.navbottom, table.msg .msgtitle, .post_hdr { background: var(--bg-secondary) !important; color: var(--text-primary) !important; border-color: var(--border-primary) !important; }
        table.threads tr.even, table.threads tr.odd, table.msg .messagecontent, table.msg .replycontent, .replycontent.p2 { background: var(--bg-primary) !important; }
        table.threads tr:hover { background: var(--bg-secondary) !important; }
        table.threads tr.even { background: var(--bg-secondary) !important; }
        table.msg .messageauthor, table.msg .replyauthor, .replyauthor.p1, .replycontent.p1 { background: var(--bg-secondary) !important; }
        a, .thread a { color: var(--accent-primary) !important; text-decoration: none !important; }
        a:hover { color: var(--accent-secondary) !important; }
        table.threads, table.threads td { border-color: var(--border-primary) !important; }
        input, select, textarea { background: var(--bg-tertiary) !important; color: var(--text-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: 6px; padding: 8px; }
        ::-webkit-scrollbar { width: 10px; background: var(--bg-primary); }
        ::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

        /* User-provided CSS for Dark Themes */
        body[data-theme='saas-dark'], body[data-theme='cappuccino-mocha-dark'] { background-color: #212121 !important; }
        body[data-theme='saas-dark'] #wrap, body[data-theme='cappuccino-mocha-dark'] #wrap { background-color: #212121; }
        body[data-theme='saas-dark'] div.post_main, body[data-theme='cappuccino-mocha-dark'] div.post_main { color: #ffebee; }
        body[data-theme='saas-dark'] td.nav, body[data-theme='cappuccino-mocha-dark'] td.nav { border-style: none; }
        body[data-theme='saas-dark'] #wrap_in, body[data-theme='cappuccino-mocha-dark'] #wrap_in { border-style: none; }
        body[data-theme='saas-dark'] td.messageauthor, body[data-theme='cappuccino-mocha-dark'] td.messageauthor,
        body[data-theme='saas-dark'] td.replyauthor.p1, body[data-theme='cappuccino-mocha-dark'] td.replyauthor.p1,
        body[data-theme='saas-dark'] td.replyauthor.p2, body[data-theme='cappuccino-mocha-dark'] td.replyauthor.p2,
        body[data-theme='saas-dark'] td.vifr, body[data-theme='cappuccino-mocha-dark'] td.vifr,
        body[data-theme='saas-dark'] td.pfr, body[data-theme='cappuccino-mocha-dark'] td.pfr,
        body[data-theme='saas-dark'] td.vfr, body[data-theme='cappuccino-mocha-dark'] td.vfr,
        body[data-theme='saas-dark'] td.hfr, body[data-theme='cappuccino-mocha-dark'] td.hfr,
        body[data-theme='saas-dark'] td.rfr, body[data-theme='cappuccino-mocha-dark'] td.rfr,
        body[data-theme='saas-dark'] td.mfr, body[data-theme='cappuccino-mocha-dark'] td.mfr { color: #fafafa; }

        /* Shape Theming */
        .roundify-theme .glp-btn, .roundify-theme #settings-panel, .roundify-theme .setting-row, .roundify-theme input, .roundify-theme select, .roundify-theme textarea, .roundify-theme .theme-option, .roundify-theme #toast-notification, .roundify-theme #thread-controls, .roundify-theme .glp-loading-indicator, .roundify-theme .quote-toggle-btn, .roundify-theme .post_wrap { border-radius: 12px !important; }
        .roundify-theme .slider { border-radius: 34px !important; }
        .roundify-theme #header-handle { border-radius: 0 0 16px 16px !important; }
        .squarify-theme * { border-radius: 0 !important; }

        /* New Declutter Rules */
        .declutter-pagetoplinks2 .pagetoplinks2 { display: none !important; }
        .declutter-tabnav .tabnav { display: none !important; }
        .declutter-threadtitle .title { display: none !important; }
        .declutter-rightpanelbox .rightpanel_ipad > div:nth-of-type(2) { display: none !important; }
        .declutter-threadsheader .threads_header_row { display: none !important; }
    `);

    // --- UI & Event Handlers ---
    function buildUI() {
        $('body').prepend(`
            <div id="header-handle">
                <a id="homepage-link" href="https://www.godlikeproductions.com" title="Go to Homepage">
                    <span>Homepage</span>
                </a>
                <button id="open-settings-btn" title="Open Settings">
                    <svg viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19-.15-.24-.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69-.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23-.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                </button>
            </div>
        `);

        $('body').append(`
            <div id="settings-panel">
                <div class="settings-header">
                    <h2><svg viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19-.15-.24-.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69-.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23-.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>Enhanced Suite Settings</h2>
                    <button id="close-settings" title="Close"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                </div>
                <div class="settings-content">
                    <h3 class="settings-section-header">Appearance & Theme</h3>
                    ${createThemeSelector()}
                    ${createToggle('roundify', 'Roundify', 'Makes all corners round for a softer look.')}
                    ${createToggle('squarify', 'Squarify', 'Makes all corners square for a sharper look.')}
                    <h3 class="settings-section-header">General Features</h3>
                    ${createToggle('autopager', 'Autopager (Infinite Scroll)', 'Automatically loads the next page when you scroll down.')}
                    ${createToggle('adBlocker', 'Persistent Ad-Blocker', 'Removes ad containers and sponsored content.')}
                    ${createToggle('bypassNag', 'Bypass Registration Nag', 'Automatically clicks the link to bypass the registration nag screen.')}
                    <h3 class="settings-section-header">Content & Thread Experience</h3>
                    ${createToggle('collapsibleQuotes', 'Collapsible Quotes', 'Adds a button to collapse long quotes in posts.')}
                    ${createToggle('collapseQuotesByDefault', 'Collapse Quotes by Default', 'Automatically collapses all quotes when a thread loads.')}
                    ${createToggle('sortByNew', 'Always Sort by Newest', 'Automatically redirects to sort threads by newest post date.')}
                    <h3 class="settings-section-header">Layout & Content Hiding</h3>
                    ${createToggle('hidePinnedThreads', 'Hide Pinned & Karma Threads', 'Hides globally pinned and karma-pinned threads from the main list.')}
                    ${createToggle('manualThreadHiding', 'Enable Manual Thread Hiding', 'Adds a "Hide" button to each thread for manual filtering.')}
                    ${createToggle('hideBanner', 'Hide Main Site Header', 'Hides the top banner of the site.')}
                    ${createToggle('hideFooter', 'Hide Main Site Footer', 'Hides the bottom footer of the site.')}
                    <h3 class="settings-section-header">Advanced Declutter</h3>
                    ${createToggle('declutterTopNav', 'Hide Forum Top Nav/Login', 'Hides the top navigation bar with login/user info.')}
                    ${createToggle('declutterThreadNav', 'Hide Thread Nav (Reply, etc)', 'Hides the navigation bar with "Reply", "Post New", etc., links within threads.')}
                    ${createToggle('declutterPolls', 'Hide "Rate this Thread" Polls', 'Hides the poll for rating a thread.')}
                    ${createToggle('declutterLastEdit', 'Hide "Last Edited by" Info', 'Hides the "Last edited by..." line in posts.')}
                    ${createToggle('declutterSignatures', 'Hide User Signatures', 'Hides user signatures at the bottom of posts.')}
                    ${createToggle('declutterReportLinks', 'Hide "Report Post" Links', 'Hides the "Report Abusive Post" links.')}
                    ${createToggle('hidePageTopLinks2', 'Hide Secondary Top Links', 'Hides the secondary links (FAQ, Search, etc.) at the top.')}
                    ${createToggle('hideTabNav', 'Hide Tab Navigation', 'Hides the main tab navigation (Forums, New Posts, etc.).')}
                    ${createToggle('hideThreadTitle', 'Hide Thread Title Block', 'Hides the main title block on a thread page.')}
                    ${createToggle('hideRightPanelBox', 'Hide Second Right Panel Box', 'Hides the second misc. box in the right sidebar.')}
                    ${createToggle('hideThreadsHeader', 'Hide Threads List Header', 'Hides the header row of the threads list (Author, Replies, etc.).')}

                    <div class="setting-row">
                        <label>You have <b id="hidden-count">${config.hiddenThreads.length}</b> manually hidden threads.</label>
                        <button id="unhide-all" class="glp-btn danger">Unhide All</button>
                    </div>
                </div>
            </div>
            <div id="toast-notification"></div>
        `);

        function createToggle(id, label, description = '') {
            const descriptionHtml = description ? `<small>${description}</small>` : '';
            return `<div class="setting-row" title="${description}"><label for="${id}-toggle">${label}</label><label class="switch"><input type="checkbox" id="${id}-toggle" ${config[id] ? 'checked' : ''}><span class="slider"></span></label>${descriptionHtml}</div>`;
        }

        function createThemeSelector() {
            return `<div class="setting-row">
                        <label>Color Theme</label>
                        <div class="theme-selector">
                            <div class="theme-option" data-theme-name="saas-dark" title="SaaS Dark (Default)"><span></span></div>
                            <div class="theme-option" data-theme-name="cappuccino-mocha-dark" title="Cappuccino Mocha"><span></span></div>
                            <div class="theme-option" data-theme-name="clean-light" title="Clean Light"><span></span></div>
                        </div>
                    </div>`;
        }

        // --- Event Handlers ---
        $('#open-settings-btn').on('click', () => $('#settings-panel').addClass('visible'));
        $('#close-settings').on('click', () => $('#settings-panel').removeClass('visible'));
        $(document).on('click', e => { if ($(e.target).is('#settings-panel')) $('#settings-panel').removeClass('visible'); });

        $('input[type="checkbox"]').on('change', function() {
            const id = this.id.replace('-toggle', '');
            config[id] = this.checked;

            if (id === 'roundify' && this.checked) { config.squarify = false; $('#squarify-toggle').prop('checked', false); }
            if (id === 'squarify' && this.checked) { config.roundify = false; $('#roundify-toggle').prop('checked', false); }

            saveConfig();
            showToast(`${$(this).closest('.setting-row').find('label:first').text()} has been ${this.checked ? 'enabled' : 'disabled'}.`);

            applyShapeTheme();
            runAllFeatures();
            initAutopager();
        });

        $('.theme-option').on('click', function() {
            const themeName = $(this).data('theme-name');
            config.theme = themeName;
            saveConfig();
            applyTheme(themeName);
            showToast(`Theme changed to ${$(this).attr('title')}.`);
        });

        $('#unhide-all').on('click', function() {
            if (confirm('Are you sure you want to show all manually hidden threads?')) {
                config.hiddenThreads = [];
                saveConfig();
                $('#hidden-count').text(0);
                showToast('All hidden threads have been restored.');
                runAllFeatures();
            }
        });
    }

    function showToast(message) {
        const toast = $('#toast-notification');
        toast.text(message).addClass('show');
        setTimeout(() => toast.removeClass('show'), 3000);
    }

    function applyTheme(themeName) {
        $('body').attr('data-theme', themeName);
        $('.theme-option').removeClass('selected');
        $(`.theme-option[data-theme-name="${themeName}"]`).addClass('selected');
    }

    function applyShapeTheme() {
        $('body').toggleClass('roundify-theme', config.roundify).toggleClass('squarify-theme', config.squarify);
    }

    // --- Core Feature Logic ---
    function initHeader() {
        const $header = $('#header');
        if($header.length) {
            const headerHeight = $header.outerHeight();
            $('body').css('padding-top', `${headerHeight + 10}px`);
        }
    }

    function bypassNagScreen() {
        if (!config.bypassNag) return;
        if ($('body:contains("Why not register for a free account?")').length > 0 || $('body:contains("To continue reading this thread you must")').length > 0) {
            const bypassLink = $('p:contains("Otherwise, continue to the page you were about to visit by clicking") a[href*="?regp="], a[href*="&regp="]:contains("here")').first();
            if (bypassLink.length > 0) {
                window.location.href = bypassLink.attr('href');
            }
        }
    }

    function manageThreads() {
        const threadsTable = $('table.threads');
        if (!threadsTable.length) return;
        if (!$('#thread-controls').length) {
            threadsTable.before('<div id="thread-controls"></div>');
            $('#thread-controls').append('<button id="hide-all-btn" class="glp-btn" title="Hide all threads currently visible on this page">Hide All on Page</button>');
            $('#thread-controls').append('<button id="sort-new-btn" class="glp-btn" title="Force sort by newest post date">Sort by Newest</button>');
            $('#hide-all-btn').on('click', () => { if (confirm('Hide all threads currently visible on this page?')) { $('tr.odd:visible, tr.even:visible').find('.glp-suite-hide-btn').click(); } });
            $('#sort-new-btn').on('click', () => { config.sortByNew = true; saveConfig(); runSortByNew(); });
        }
        if (threadsTable.find('tr.threads_header_row .glp-suite-hide-cell').length === 0) {
            threadsTable.find('tr.threads_header_row .sfr, tr.threads_header_row .sh').after('<th class="glp-suite-hide-cell">Hide</th>');
        }
        threadsTable.find('tbody > tr:not(.threads_header_row)').each(function() {
            const row = $(this);
            if (row.find('.glp-suite-hide-cell').length) return;
            const threadLink = row.find('.sfr a');
            if (!threadLink.length) return;
            const threadId = threadLink.attr('href');
            row.find('.sfr').after('<td class="glp-suite-hide-cell"><span class="glp-suite-hide-btn" title="Hide this thread">Hide</span></td>');
            row.find('.glp-suite-hide-btn').on('click', function(e) { e.preventDefault(); e.stopPropagation(); if (!config.hiddenThreads.includes(threadId)) { config.hiddenThreads.push(threadId); saveConfig(); $('#hidden-count').text(config.hiddenThreads.length); row.addClass('glp-suite-hidden-thread'); showToast('Thread hidden.'); } });
            row.toggleClass('glp-suite-hidden-thread', config.manualThreadHiding && config.hiddenThreads.includes(threadId));
        });
        $('.glp-suite-hide-cell, #hide-all-btn').toggle(config.manualThreadHiding);
    }

    function initCollapsibleQuotes() {
        if (!config.collapsibleQuotes) {
            $('.quote-toggle').remove();
            $('div.quotei').removeClass('glp-collapsed');
            return;
        }
        $('div.quotei:not(.glp-quote-processed)').each(function() {
            const $quote = $(this).addClass('glp-quote-processed');
            const $toggleBtn = $('<div class="quote-toggle"><span class="quote-toggle-btn"></span></div>');
            $quote.before($toggleBtn);

            const isInitiallyCollapsed = config.collapseQuotesByDefault;
            $quote.toggleClass('glp-collapsed', isInitiallyCollapsed);
            $toggleBtn.find('.quote-toggle-btn').text(isInitiallyCollapsed ? 'Expand Quote' : 'Collapse Quote');

            $toggleBtn.on('click', function() {
                $quote.toggleClass('glp-collapsed');
                const isCollapsed = $quote.hasClass('glp-collapsed');
                $(this).find('.quote-toggle-btn').text(isCollapsed ? 'Expand Quote' : 'Collapse Quote');
            });
        });
    }

    function runSortByNew() {
        if (!config.sortByNew || window.location.pathname.includes('/message')) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('sort') !== 'posted' || params.get('order') !== 'desc') {
            params.set('sort', 'posted');
            params.set('order', 'desc');
            window.location.search = params.toString();
        }
    }

    function removeAds() {
        if (!config.adBlocker) return;
        const adSelectors = ['div[id^="ad-"]', '.msgad', 'div[data-type="_mgwidget"]', 'div.mgbox', 'amp-embed[type="mgid"]', 'center > div[style*="text-align: center"]'];
        $(adSelectors.join(', ')).each(function() {
            const adElement = $(this);
            if (adElement.closest('#g_m, #g_m_s').length > 0) return;
            let parentToRemove = adElement.closest('div[style*="margin-bottom"], center');
            (parentToRemove.length > 1 && parentToRemove.parent().prop('tagName') !== 'BODY' ? parentToRemove : adElement).remove();
        });
    }

    function runAllFeatures() {
        // Simple Toggles
        $('.hdr_banner').toggle(!config.hideBanner);
        $('#footer').toggle(!config.hideFooter);
        $('table.threads.related').closest('.threads-wrapper').toggle(!config.hideRelatedThreads);
        $("tr.odd, tr.even").has("span[title='Pinned Thread'], span[title='Karma Pin']").toggle(!config.hidePinnedThreads);

        // Body-class based toggles for decluttering
        $('body').toggleClass('declutter-top-nav', config.declutterTopNav);
        $('body').toggleClass('declutter-thread-nav', config.declutterThreadNav);
        $('body').toggleClass('declutter-polls', config.declutterPolls);
        $('body').toggleClass('declutter-last-edit', config.declutterLastEdit);
        $('body').toggleClass('declutter-signatures', config.declutterSignatures);
        $('body').toggleClass('declutter-report-links', config.declutterReportLinks);
        $('body').toggleClass('declutter-pagetoplinks2', config.hidePageTopLinks2);
        $('body').toggleClass('declutter-tabnav', config.hideTabNav);
        $('body').toggleClass('declutter-threadtitle', config.hideThreadTitle);
        $('body').toggleClass('declutter-rightpanelbox', config.hideRightPanelBox);
        $('body').toggleClass('declutter-threadsheader', config.hideThreadsHeader);

        // Hide elements directly (more complex selectors)
        $('.rightpanel_ipad > .topnav').toggle(!config.declutterTopNav);
        $('.topnav:has(.messagebottomnavlinks)').toggle(!config.declutterThreadNav);
        $('form[action="/bbs/vote.php"]').toggle(!config.declutterPolls);
        $('span.lastedit').toggle(!config.declutterLastEdit);
        $('.sig1, .sig2').toggle(!config.declutterSignatures);
        $('a[href*="/abusive"], a[href*="/copyright"]').toggle(!config.declutterReportLinks);

        // Complex features
        manageThreads();
        initCollapsibleQuotes();
        removeAds();
    }

    // --- Autopager ---
    const pagerConfigs = {
        forum: { trigger: '.footer .navpages', content: 'table.threads > tbody > tr:not(.threads_header_row)', container: 'table.threads > tbody' },
        thread: { trigger: 'td.navbottom .navpages', content: 'table#g_m_s > tbody > tr:not(:has(td.navbottom))', container: 'table#g_m_s > tbody' }
    };

    function initAutopager() {
        if (autopagerObserver) autopagerObserver.disconnect();
        if (!config.autopager) return;

        const pageType = window.location.pathname.includes('/message') ? 'thread' : 'forum';
        const pageConfig = pagerConfigs[pageType];
        const targetNode = document.querySelector(pageConfig.trigger);
        if (!targetNode) return;

        autopagerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoadingNextPage) {
                    loadNextPage(entry.target, pageConfig);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '800px' });
        autopagerObserver.observe(targetNode);
    }

    function loadNextPage(paginationElement, pageConfig) {
        const $pagination = $(paginationElement);
        const nextPageLink = $pagination.find('b').next('a');
        if (!nextPageLink.length) {
            $pagination.html('<div class="glp-loading-indicator">End of content.</div>');
            return;
        }

        const nextPageUrl = nextPageLink.attr('href');
        isLoadingNextPage = true;
        const $paginationContainer = $pagination.closest(pageConfig.trigger === pagerConfigs.thread.trigger ? 'tr' : '.footer');
        const loadingHtml = `<div class="glp-loading-indicator">Loading next page...</div>`;
        $paginationContainer.html(pageConfig.trigger === pagerConfigs.thread.trigger ? `<td colspan="2">${loadingHtml}</td>` : loadingHtml);

        $.get(nextPageUrl)
            .done(data => {
                const $data = $(data);
                const newContent = $data.find(pageConfig.content);
                const $newPaginationContainer = $data.find(pageConfig.trigger).closest(pageConfig.trigger === pagerConfigs.thread.trigger ? 'tr' : '.footer');

                $(pageConfig.container).append(newContent);
                runAllFeatures();

                $paginationContainer.remove();
                if ($newPaginationContainer.length) {
                    $(pageConfig.container).append($newPaginationContainer);
                    initAutopager();
                }
            })
            .fail(() => { $paginationContainer.html('<div class="glp-loading-indicator" style="color: var(--action-danger);">Failed to load next page.</div>'); })
            .always(() => { isLoadingNextPage = false; });
    }

    // --- Initialization ---
    function init() {
        applyTheme(config.theme);
        applyShapeTheme();
        bypassNagScreen();
        runSortByNew();
        buildUI();
        initHeader();
        runAllFeatures();
        initAutopager();

        const adObserver = new MutationObserver(() => removeAds());
        adObserver.observe(document.body, { childList: true, subtree: true });

        // Re-calculate header padding on window load to account for images/other content
        $(window).on('load', initHeader);
    }

    $(document).ready(init);

})();
