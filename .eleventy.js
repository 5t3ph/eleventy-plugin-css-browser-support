const { cssBrowserSupport, BROWSERS } = require("css-browser-support");

const PLUGIN = "css-support";
const defaults = {
  browserList: ["chrome", "edge", "firefox", "safari"],
  showPanelTable: true,
  includePanelJS: true,
};

const fs = require("fs");
const path = require("path");
const panelJS = fs.readFileSync(
  path.resolve(__dirname, "panels.min.js"),
  "utf8"
);

const newTableHeader = (browserTitle) =>
  `<th class="${PLUGIN}-header--${browserTitle
    .toLowerCase()
    .replaceAll(" ", "-")}">${browserTitle}</th>`;

const newTableRow = (flagged, sinceVersion) => {
  const support = sinceVersion
    ? !isNaN(parseInt(sinceVersion))
      ? `v${sinceVersion}+`
      : sinceVersion
    : "N/A";

  let tableCellClasses;

  if (flagged) {
    tableCellClasses = `${PLUGIN}-cell--flagged`;
  }

  if (support === "N/A") {
    tableCellClasses = `${PLUGIN}-cell--na`;
  }

  return `<td ${
    tableCellClasses ? `class="${tableCellClasses}"` : ``
  }>${support}</td>`;
};

const createPanelSupportTable = (
  browserList,
  query,
  label,
  codeContent,
  showTable = true
) => {
  const supportData =
    cssBrowserSupport(query)[query.replace(/@|:|\(|\)*/g, "")];

  if (supportData) {
    let table = "";
    if (showTable) {
      let tableHeader = "";
      let tableRow = "";
      browserList.map((browser) => {
        const { sinceVersion, browserTitle, flagged } = supportData[browser];

        tableHeader += newTableHeader(browserTitle);

        tableRow += newTableRow(flagged, sinceVersion);
      });

      table = `<div class="${PLUGIN}-panel-table-container"><table class="${PLUGIN}-table"><caption>${label}</caption><thead>${tableHeader}</thead><tbody><tr>${tableRow}</tr></tbody></table></div>`;
    }

    return `${table}<small><em>Global <code>${codeContent}</code> support:</em> ${supportData.globalSupport}%<br><a href="https://caniuse.com/?search=${codeContent}">caniuse data for ${codeContent}</a></small>`;
  }

  return "";
};

const browserCheck = (browserList) => {
  let valid = true;
  browserList.map((b) => {
    if (!BROWSERS.includes(b)) {
      showError(`${b} is not a valid browser`);
      valid = false;
    }
  });
  return valid;
};

const showError = (msg) => {
  console.log("\x1b[31m%s\x1b[0m", msg);
};

module.exports = (eleventyConfig, options) => {
  // Combine defaults with user defined options
  const { browserList, showPanelTable, includePanelJS, tableCaption } = {
    ...defaults,
    ...options,
  };

  // Filter to opt-in to support panels
  eleventyConfig.addFilter("cssSupport", (query) => {
    if (browserCheck(browserList)) {
      const supportData = query === "gap" ? false : cssBrowserSupport(query);
      if (supportData) {
        return `<code data-css-support>${query}</code>`;
      }
    }

    return `<code>${query}</code>`;
  });

  // Template filter to append panel data
  eleventyConfig.addFilter("cssSupportPanels", (templateContent) => {
    let originalContent = templateContent;
    let content = originalContent;

    if (browserCheck(browserList)) {
      const codeRegex =
        /<code data-css-support(?:\sclass=".*")?>([\w-]+)?(:?(.*?))<\/code>/gm;
      let queryMatches = new Set();

      let supportPanels = [];

      let m;
      while ((m = codeRegex.exec(originalContent)) !== null) {
        if (m.index === codeRegex.lastIndex) {
          codeRegex.lastIndex++;
        }

        const codeBlock = m[0];
        let query = m[1];
        let value = m[2] ? m[2] : "";

        if (value && !query) {
          query = value;
          value = "";
        }

        // Only attach to first instance of duplicate queries
        if (queryMatches.has(query)) continue;

        queryMatches.add(query);

        const queryValue = value === "()" ? value : "";
        const codeContent = `${query}${queryValue}`;
        const label = `Browser support for <code>${codeContent}</code>`;
        const ariaLabel = `Browser support for ${codeContent}`;
        const panelID = query.replace(/@|:|\(|\)*/g, "");

        const supportPanel =
          `<span class="${PLUGIN}-panel-container"><code>${query}${value}</code><button type="button" class="${PLUGIN}-button" aria-label="${ariaLabel}" aria-expanded="false" aria-controls="${PLUGIN}-${panelID}"> <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="${PLUGIN}-icon" viewBox="0 0 24 24" width="24" height="24" style="pointer-events: none"><path fill="currentColor" d="M7 17h2v-7H7Zm4 0h2V7h-2Zm4 0h2v-4h-2ZM5 21q-.8 0-1.4-.6Q3 19.8 3 19V5q0-.8.6-1.4Q4.2 3 5 3h14q.8 0 1.4.6.6.6.6 1.4v14q0 .8-.6 1.4-.6.6-1.4.6Z"/></svg></button></span>`.trim();

        supportPanels.push(
          `<div hidden id="${PLUGIN}-${panelID}" class="${PLUGIN}-panel">${createPanelSupportTable(
            browserList,
            query,
            label,
            codeContent,
            showPanelTable
          )}</div>`
        );

        content = content.replace(codeBlock, supportPanel);
      }

      let panelScript = "";
      if (supportPanels.length && includePanelJS) {
        panelScript = `<script>${panelJS}</script>`;
      }

      return content + supportPanels.join("") + "\n" + panelScript;
    }

    return content;
  });

  // Shortcode to render a support table for one or more queries
  eleventyConfig.addShortcode(
    "cssSupportTable",
    (queryList, captionOverride) => {
      if (browserCheck(browserList)) {
        let queries = queryList.includes(",")
          ? queryList.split(",")
          : [queryList];
        queries = queries.map((i) => i.trim());
        const supportData = cssBrowserSupport(queries);
        let table = "";

        // Handle special case: gap
        if (queries.includes("gap")) {
          queries.splice(queries.indexOf("gap"), 1);
          queries.push("gap - flexbox");
          queries.push("gap - grid");
        }

        if (supportData) {
          let tableHeader = ["<td></td>"];
          let tableRows = [];
          for (let query of queries) {
            query = query.trim();
            const queryData = supportData[query.replace(/@|:|\(|\)*/g, "")];

            if (queryData) {
              let tableRow = `<tr><th><code>${query}</code></th>`;

              browserList.map((browser, i) => {
                const { sinceVersion, browserTitle, flagged } =
                  queryData[browser];

                if (!tableHeader[i + 1]) {
                  tableHeader[i + 1] = newTableHeader(browserTitle);
                }

                tableRow += newTableRow(flagged, sinceVersion);
              });

              tableRow += `<td><a href="https://caniuse.com/?search=${query}">${queryData.globalSupport}%</a></td>`;

              tableRows.push(tableRow + "</tr>");
            } else {
              showError(`Sorry - '${query}' has no available support data`);
            }
          }

          tableHeader.push(`<th>Global Support</th>`);

          const caption =
            captionOverride || tableCaption
              ? `<caption>${captionOverride || tableCaption}</caption>`
              : "";

          table = `<div class="${PLUGIN}-table-container"><table class="${PLUGIN}-table">${caption}
        <thead>${tableHeader.join("")}</thead>
        <tbody>${tableRows.join("")}</tbody>
      </table>
      <p>Global support data from <a href="https://caniuse.com/">caniuse.com</a></p>
      </div>`;
        }

        return table;
      }

      return "";
    }
  );
};
