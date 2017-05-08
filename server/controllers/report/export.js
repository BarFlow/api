import xl from 'excel4node';
import moment from 'moment';
import _ from 'lodash';

const convertStatsToArray = stats =>
  Object.keys(stats.types)
  .map((key) => {
    const type = stats.types[key];
    type.label = key;
    type.categories =
      Object.keys(type.categories).map((cKey) => {
        const category = type.categories[cKey];
        category.label = cKey;
        category.sub_categories =
          Object.keys(category.sub_categories).map((scKey) => {
            const sub_category = category.sub_categories[scKey]; //eslint-disable-line
            sub_category.label = scKey;
            return sub_category; //eslint-disable-line
          });
        return category;
      });
    return type;
  });

// ************************** STYLES

const title = wb => wb.createStyle({
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: '#383838'
  },
  alignment: {
    horizontal: 'center'
  },
  font: {
    bold: true,
    color: '#FFFFFF',
    size: 14
  }
});

const heading = wb => wb.createStyle({
  font: {
    bold: true,
  },
  alignment: {
    horizontal: 'center'
  },
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: '#ececec'
  }
});

const yellowBg = wb => wb.createStyle({
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: '#FFFF00'
  }
});

const bold = wb => wb.createStyle({
  font: {
    bold: true,
  }
});

const currencyStyle = wb => wb.createStyle({
  numberFormat: '£#,##0.00; [Red]-£#,##0.00; £0.00'
});

const percentage = wb => wb.createStyle({
  numberFormat: '0.00%; [Red]-0.00%; 0.00%'
});

const decimalNum = wb => wb.createStyle({
  numberFormat: '0.00; [Red]-0.00; 0.00'
});

const alignLeft = wb => wb.createStyle({
  alignment: {
    horizontal: 'left'
  }
});

const alignRight = wb => wb.createStyle({
  alignment: {
    horizontal: 'right'
  }
});

const alignCenter = wb => wb.createStyle({
  alignment: {
    horizontal: 'center'
  }
});

const indent = (wb, val = 1) => wb.createStyle({
  alignment: {
    indent: val
  }
});

// ************************** END OF STYLES

// Stock Report Export
const reportToXLS = (report, {
  profile: {
    name: venueName = ''
  }
}) => {
  // Create a new instance of  a Workbook class
  const wb = new xl.Workbook({
    dateFormat: 'dd.mm.yyyy;@'
  });

  const summaryWs = wb.addWorksheet('Summary');
  // Set column widths
  summaryWs.column(1).setWidth(40);
  summaryWs.column(2).setWidth(40);

  // Summary Header
  summaryWs.cell(1, 1, 1, 2, true).string('Stock Report - Summary').style(title(wb));
  summaryWs.cell(2, 1, 4, 2).style(yellowBg(wb));
  summaryWs.cell(2, 1).string('Venue:').style(bold(wb));
  summaryWs.cell(2, 2).string(venueName);
  summaryWs.cell(3, 1).string('Date:').style(bold(wb));
  summaryWs.cell(3, 2).string(moment(report.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));
  summaryWs.cell(4, 1).string('Created by:').style(bold(wb));
  summaryWs.cell(4, 2).string(`${report.created_by.name} <${report.created_by.email}>`).style(alignLeft(wb));

  // setting currentRow
  let currentRow = 4;

  // Columns definitions
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 2).style(heading(wb));
  summaryWs.cell(currentRow, 1).string('Category'); // A
  summaryWs.cell(currentRow, 2).string('Net. Value'); // B

  const typesArray = convertStatsToArray(report.stats);

  // List items
  typesArray.forEach((type) => {
    ++currentRow;
    summaryWs.cell(currentRow, 1).string(`${type.label}`).style(bold(wb));
    summaryWs.cell(currentRow, 2).number(type.value).style(currencyStyle(wb));
    type.categories.forEach((category) => {
      ++currentRow;
      summaryWs.cell(currentRow, 1).string(`${category.label}`).style(bold(wb)).style(indent(wb));
      summaryWs.cell(currentRow, 2).number(category.value).style(currencyStyle(wb));
      category.sub_categories.forEach((sub_category) => { //eslint-disable-line
        ++currentRow;
        summaryWs.cell(currentRow, 1).string(`${sub_category.label}`).style(indent(wb, 2));
        summaryWs.cell(currentRow, 2).number(sub_category.value).style(currencyStyle(wb));
      });
    });
  });

  // Claculate total value
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 2).style(heading(wb));
  summaryWs.cell(currentRow, 1).string('Total').style(alignLeft(wb));
  summaryWs.cell(currentRow, 2)
    .number(report.stats.total_value)
    .style(currencyStyle(wb))
    .style(alignRight(wb));

  // Barflow branding
  ++currentRow;
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 2, true).string('Powered by BarFlow').style(alignCenter(wb));
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 2, true).link('http://barflow.io').style(alignCenter(wb));

  // Add Worksheets to the workbook
  const productsWs = wb.addWorksheet('Products');

  // Calculate longest item name's length
  const descriptionMaxLength = report.data.reduce((mem, item) => {
    const name = item.product_id.name;
    if (name.length > mem) {
      mem = name.length;
    }
    return mem;
  }, 10);

  // Set column widths
  productsWs.column(1).setWidth(25);
  productsWs.column(2).setWidth(descriptionMaxLength);

  // Header
  productsWs.cell(1, 1, 1, 6, true).string('Stock Report - Products').style(title(wb));
  productsWs.cell(2, 1, 4, 6).style(yellowBg(wb));
  productsWs.cell(2, 1).string('Venue:').style(bold(wb));
  productsWs.cell(2, 2).string(venueName);
  productsWs.cell(3, 1).string('Date:').style(bold(wb));
  productsWs.cell(3, 2).string(moment(report.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));
  productsWs.cell(4, 1).string('Created by:').style(bold(wb));
  productsWs.cell(4, 2).string(`${report.created_by.name} <${report.created_by.email}>`).style(alignLeft(wb));

  // setting currentRow
  currentRow = 4;

  // Columns definitions
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6).style(heading(wb));
  productsWs.cell(currentRow, 1).string('Category'); // A
  productsWs.cell(currentRow, 2).string('Description'); // B
  productsWs.cell(currentRow, 3).string('Net. Price'); // C
  productsWs.cell(currentRow, 4).string('Par Level'); // D
  productsWs.cell(currentRow, 5).string('Stock Level'); // E
  productsWs.cell(currentRow, 6).string('Net. Value'); // F

  // List items
  report.data.forEach(({
      cost_price: price = 0,
      par_level: parLevel = 0,
      volume: stockLevel = 0,
      value = 0,
      product_id: product = {
        name: 'other',
        sub_category: 'other'
      }
    }) => {
    ++currentRow;
    productsWs.cell(currentRow, 1).string(`${product.category} / ${product.sub_category}`);
    productsWs.cell(currentRow, 2).string(product.name);
    productsWs.cell(currentRow, 3).number(price).style(currencyStyle(wb));
    productsWs.cell(currentRow, 4).number(parLevel);
    productsWs.cell(currentRow, 5).number(Math.round(stockLevel * 100) / 100);
    productsWs.cell(currentRow, 6).number(value).style(currencyStyle(wb));
  });

  // Claculate total value
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6).style(heading(wb)).style(alignRight(wb));
  productsWs.cell(currentRow, 5).string('Total');
  productsWs.cell(currentRow, 6).formula(`SUM(F6:F${(currentRow - 1)})`).style(currencyStyle(wb));


  // Barflow branding
  ++currentRow;
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6, true).string('Powered by BarFlow').style(alignCenter(wb));
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6, true).link('http://barflow.io').style(alignCenter(wb));

  return wb;
};

const usageReportToXLS = ({
  stats,
  data,
  open,
  close
}, {
  profile: {
    name: venueName = ''
  }
}) => {
  // Create a new instance of  a Workbook class
  const wb = new xl.Workbook({
    dateFormat: 'dd.mm.yyyy;@'
  });

  const summaryWs = wb.addWorksheet('Summary');
  // Set column widths
  summaryWs.column(1).setWidth(40);
  summaryWs.column(2).setWidth(40);
  summaryWs.column(4).setWidth(15);

  // Summary Header
  summaryWs.cell(1, 1, 1, 5, true).string('Stock Period Report - Summary').style(title(wb));
  summaryWs.cell(2, 1, 4, 5).style(yellowBg(wb));
  summaryWs.cell(2, 1).string('Venue:').style(bold(wb));
  summaryWs.cell(2, 2).string(venueName);
  summaryWs.cell(3, 1).string('Opening Stock:').style(bold(wb));
  summaryWs.cell(3, 2).string(moment(open.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));
  summaryWs.cell(4, 1).string('Closing Stock:').style(bold(wb));
  summaryWs.cell(4, 2).string(moment(close.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));

  // setting currentRow
  let currentRow = 4;

  // Columns definitions
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 5).style(heading(wb));
  summaryWs.cell(currentRow, 1).string('Category'); // A
  summaryWs.cell(currentRow, 2).string('Cost of Goods Sold'); // B
  summaryWs.cell(currentRow, 3).string('Sale'); // C
  summaryWs.cell(currentRow, 4).string('Gross Profit'); // D
  summaryWs.cell(currentRow, 5).string('GP %'); // E

  const typesArray = convertStatsToArray(stats);

  // List items
  typesArray.forEach((type) => {
    ++currentRow;
    summaryWs.cell(currentRow, 1).string(`${type.label}`).style(bold(wb));
    summaryWs.cell(currentRow, 2).number(type.value).style(currencyStyle(wb));
    summaryWs.cell(currentRow, 3).style(currencyStyle(wb));
    summaryWs.cell(currentRow, 4).formula(`C${currentRow}-B${currentRow}`).style(currencyStyle(wb));
    summaryWs.cell(currentRow, 5).formula(`IFERROR(D${currentRow}/C${currentRow},0)`).style(percentage(wb));
    type.categories.forEach((category) => {
      ++currentRow;
      summaryWs.cell(currentRow, 1).string(`${category.label}`).style(bold(wb)).style(indent(wb));
      summaryWs.cell(currentRow, 2).number(category.value).style(currencyStyle(wb));
      summaryWs.cell(currentRow, 3).style(currencyStyle(wb));
      summaryWs.cell(currentRow, 4).formula(`C${currentRow}-B${currentRow}`).style(currencyStyle(wb));
      summaryWs.cell(currentRow, 5).formula(`IFERROR(D${currentRow}/C${currentRow},0)`).style(percentage(wb));
      category.sub_categories.forEach((sub_category) => { //eslint-disable-line
        ++currentRow;
        summaryWs.cell(currentRow, 1).string(`${sub_category.label}`).style(indent(wb, 2));
        summaryWs.cell(currentRow, 2).number(sub_category.value).style(currencyStyle(wb));
        summaryWs.cell(currentRow, 3).style(currencyStyle(wb));
        summaryWs.cell(currentRow, 4).formula(`C${currentRow}-B${currentRow}`).style(currencyStyle(wb));
        summaryWs.cell(currentRow, 5).formula(`IFERROR(D${currentRow}/C${currentRow},0)`).style(percentage(wb));
      });
    });
  });

  // Claculate total value
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 5).style(heading(wb));
  summaryWs.cell(currentRow, 1).string('Total').style(alignLeft(wb));
  summaryWs.cell(currentRow, 2)
    .number(stats.total_value)
    .style(currencyStyle(wb))
    .style(alignRight(wb));
  summaryWs.cell(currentRow, 3).style(currencyStyle(wb));
  summaryWs.cell(currentRow, 4).formula(`C${currentRow}-B${currentRow}`).style(currencyStyle(wb));
  summaryWs.cell(currentRow, 5).formula(`IFERROR(D${currentRow}/C${currentRow},0)`).style(percentage(wb));

  // Barflow branding
  ++currentRow;
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 5, true).string('Powered by BarFlow').style(alignCenter(wb));
  ++currentRow;
  summaryWs.cell(currentRow, 1, currentRow, 5, true).link('http://barflow.io').style(alignCenter(wb));

  // Add Worksheets to the workbook
  const productsWs = wb.addWorksheet('Products');

  // Calculate longest item name's length
  const descriptionMaxLength = data.reduce((mem, item) => {
    const name = item.product_id.name;
    if (name.length > mem) {
      mem = name.length;
    }
    return mem;
  }, 10);

  // Set column widths
  productsWs.column(1).setWidth(25);
  productsWs.column(2).setWidth(descriptionMaxLength);
  productsWs.column(7).setWidth(15);

  // Header
  productsWs.cell(1, 1, 1, 7, true).string('Stock Period Report - Products').style(title(wb));
  productsWs.cell(2, 1, 4, 7).style(yellowBg(wb));
  productsWs.cell(2, 1).string('Venue:').style(bold(wb));
  productsWs.cell(2, 2).string(venueName);
  productsWs.cell(3, 1).string('Opening Stock:').style(bold(wb));
  productsWs.cell(3, 2).string(moment(open.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));
  productsWs.cell(4, 1).string('Closing Stock:').style(bold(wb));
  productsWs.cell(4, 2).string(moment(close.created_at).format('DD/MM/YYYY HH:mm')).style(alignLeft(wb));

  // setting currentRow
  currentRow = 4;

  // Columns definitions
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 7).style(heading(wb));
  productsWs.cell(currentRow, 1).string('Category'); // A
  productsWs.cell(currentRow, 2).string('Description'); // B
  productsWs.cell(currentRow, 3).string('Net. Cost'); // C
  productsWs.cell(currentRow, 4).string('Usage'); // D
  productsWs.cell(currentRow, 5).string('Unit'); // E
  productsWs.cell(currentRow, 6).string('Sold (Unit)'); // F
  productsWs.cell(currentRow, 7).string('Variance (Unit)'); // G

  // List items
  _.orderBy(data, 'usage', 'desc').forEach(({
      cost_price: price = 0,
      usage = 0,
      count_by: countBy = 'bottle',
      product_id: product = {
        name: 'other',
        sub_category: 'other'
      }
    }) => {
    ++currentRow;
    productsWs.cell(currentRow, 1).string(`${product.category} / ${product.sub_category}`);
    productsWs.cell(currentRow, 2).string(product.name);
    productsWs.cell(currentRow, 3).number(usage * price).style(currencyStyle(wb));
    productsWs.cell(currentRow, 4).number(usage).style(decimalNum(wb));
    productsWs.cell(currentRow, 5).string(countBy);
    productsWs.cell(currentRow, 7).formula(`F${currentRow}-D${currentRow}`).style(decimalNum(wb));
  });

  // Barflow branding
  ++currentRow;
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6, true).string('Powered by BarFlow').style(alignCenter(wb));
  ++currentRow;
  productsWs.cell(currentRow, 1, currentRow, 6, true).link('http://barflow.io').style(alignCenter(wb));

  return wb;
};

export default {
  reportToXLS,
  usageReportToXLS
};
