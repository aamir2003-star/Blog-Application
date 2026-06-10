import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// A4 page usable width: 595 - 2*50 = 495pt
const PAGE_WIDTH = 495;

const styles = StyleSheet.create({
  page: {
    paddingTop: 65,
    paddingBottom: 65,
    paddingHorizontal: 50,
    fontSize: 10,
    lineHeight: 1.6,
    fontFamily: 'Helvetica',
    color: '#1a1c1b',
  },
  // ── Fixed header / footer: NEVER use justifyContent:'space-between' inside
  // fixed+absolute views – it causes the -9.44e21 translate crash in react-pdf.
  // Instead we use two sibling Text nodes with explicit widths that add up to PAGE_WIDTH.
  header: {
    position: 'absolute',
    top: 30,
    left: 50,
    width: PAGE_WIDTH,
    height: 16,
    fontSize: 8,
    color: '#5f5e5e',
  },
  headerRow: {
    flexDirection: 'row',
    width: PAGE_WIDTH,
    marginBottom: 4,
  },
  headerLeft: {
    width: 275,
    fontSize: 8,
  },
  headerRight: {
    width: 220,
    fontSize: 8,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    width: PAGE_WIDTH,
    height: 16,
    fontSize: 8,
    color: '#5f5e5e',
  },
  footerRow: {
    flexDirection: 'row',
    width: PAGE_WIDTH,
    marginTop: 4,
  },
  footerLeft: {
    width: 248,
    fontSize: 8,
  },
  footerRight: {
    width: 247,
    fontSize: 8,
    textAlign: 'right',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#bbcabb',
    width: PAGE_WIDTH,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1a1c1b',
    lineHeight: 1.25,
  },
  authorRow: {
    flexDirection: 'row',
    marginBottom: 8,
    fontSize: 9,
    color: '#5f5e5e',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  heading1: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    color: '#006d38',
  },
  heading2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#006d38',
  },
  list: {
    marginBottom: 8,
    paddingLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
  },
  listContent: {
    // Use explicit width instead of flex:1 to avoid overflow calc issues
    width: PAGE_WIDTH - 24,
  },
  codeContainer: {
    backgroundColor: '#f4f4f2',
    padding: 8,
    marginBottom: 8,
    width: PAGE_WIDTH,
  },
  codeLine: {
    fontFamily: 'Courier',
    fontSize: 8,
    lineHeight: 1.3,
  },
  coverImage: {
    width: PAGE_WIDTH,
    height: 180,
    marginBottom: 16,
    objectFit: 'cover',
  },
  inlineImage: {
    width: PAGE_WIDTH,
    height: 150,
    marginVertical: 10,
    objectFit: 'cover',
  },
  hr: {
    height: 0.5,
    backgroundColor: '#bbcabb',
    marginVertical: 12,
    width: PAGE_WIDTH,
  },
  blockquote: {
    flexDirection: 'row',
    marginVertical: 10,
    width: PAGE_WIDTH,
  },
  blockquoteBar: {
    width: 3,
    backgroundColor: '#006d38',
  },
  blockquoteContent: {
    width: PAGE_WIDTH - 13,
    paddingLeft: 10,
  },
  blockquoteText: {
    fontFamily: 'Helvetica-Oblique',
    color: '#3d4a3e',
  },
});

/**
 * Helper to recursively parse and render text nodes with inline styles (b, i, code, a).
 * Filters out null values so we do not pass invalid nodes to React-PDF <Text>.
 */
const renderTextWithInlineStyles = (node: Node, index: number): React.ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    const style: Record<string, string> = {};
    if (tagName === 'strong' || tagName === 'b') {
      style.fontFamily = 'Helvetica-Bold';
    }
    if (tagName === 'em' || tagName === 'i') {
      style.fontFamily = 'Helvetica-Oblique';
    }
    if (tagName === 'code') {
      style.fontFamily = 'Courier';
      style.backgroundColor = '#eeeeec';
    }
    if (tagName === 'a') {
      style.color = '#005228';
      style.textDecoration = 'underline';
    }

    const children = Array.from(element.childNodes)
      .map((child, idx) => renderTextWithInlineStyles(child, idx))
      .filter((c): c is React.ReactNode => c !== null && c !== undefined);

    return (
      <Text key={index} style={style}>
        {children}
      </Text>
    );
  }

  return null;
};

/**
 * Main HTML-to-PDF parser: parses the raw HTML string using browser DOMParser
 * and outputs an array of React-PDF components.
 *
 * Key rules to avoid the -9.44e21 crash:
 *  - Never use justifyContent:'space-between' inside fixed/absolute views.
 *  - Never use flex:1 inside fixed/absolute views; use explicit widths instead.
 *  - Never use percentage widths ('100%') inside flex children of absolute containers.
 */
const parseHtmlToPdfComponents = (html: string): React.ReactNode[] => {
  if (typeof window === 'undefined' || !html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const components: React.ReactNode[] = [];

  Array.from(body.childNodes).forEach((node, index) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'p') {
      const children = Array.from(element.childNodes)
        .map((child, idx) => renderTextWithInlineStyles(child, idx))
        .filter((c): c is React.ReactNode => c !== null && c !== undefined);

      components.push(
        <Text key={index} style={styles.paragraph}>
          {children}
        </Text>
      );
    } else if (tagName === 'h1' || tagName === 'h2') {
      const children = Array.from(element.childNodes)
        .map((child, idx) => renderTextWithInlineStyles(child, idx))
        .filter((c): c is React.ReactNode => c !== null && c !== undefined);

      components.push(
        <Text key={index} style={styles.heading1}>
          {children}
        </Text>
      );
    } else if (tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      const children = Array.from(element.childNodes)
        .map((child, idx) => renderTextWithInlineStyles(child, idx))
        .filter((c): c is React.ReactNode => c !== null && c !== undefined);

      components.push(
        <Text key={index} style={styles.heading2}>
          {children}
        </Text>
      );
    } else if (tagName === 'ul') {
      components.push(
        <View key={index} style={styles.list}>
          {Array.from(element.children).map((li, liIdx) => {
            const children = Array.from(li.childNodes)
              .map((child, idx) => renderTextWithInlineStyles(child, idx))
              .filter((c): c is React.ReactNode => c !== null && c !== undefined);

            return (
              <View key={liIdx} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listContent}>
                  {children}
                </Text>
              </View>
            );
          })}
        </View>
      );
    } else if (tagName === 'ol') {
      components.push(
        <View key={index} style={styles.list}>
          {Array.from(element.children).map((li, liIdx) => {
            const children = Array.from(li.childNodes)
              .map((child, idx) => renderTextWithInlineStyles(child, idx))
              .filter((c): c is React.ReactNode => c !== null && c !== undefined);

            return (
              <View key={liIdx} style={styles.listItem}>
                <Text style={styles.listBullet}>{`${liIdx + 1}.`}</Text>
                <Text style={styles.listContent}>
                  {children}
                </Text>
              </View>
            );
          })}
        </View>
      );
    } else if (tagName === 'pre') {
      const codeNode = element.querySelector('code');
      const codeText = codeNode ? codeNode.textContent : element.textContent;
      const codeLines = (codeText || '').split('\n');
      components.push(
        <View key={index} style={styles.codeContainer}>
          {codeLines.map((line, lineIdx) => (
            <Text key={lineIdx} style={styles.codeLine}>
              {line || ' '}
            </Text>
          ))}
        </View>
      );
    } else if (tagName === 'img') {
      const src = element.getAttribute('src');
      if (src) {
        components.push(
          <Image key={index} style={styles.inlineImage} src={src} />
        );
      }
    } else if (tagName === 'hr') {
      components.push(
        <View key={index} style={styles.hr} />
      );
    } else if (tagName === 'blockquote') {
      const children = Array.from(element.childNodes)
        .map((child, idx) => renderTextWithInlineStyles(child, idx))
        .filter((c): c is React.ReactNode => c !== null && c !== undefined);

      components.push(
        <View key={index} style={styles.blockquote}>
          <View style={styles.blockquoteBar} />
          <View style={styles.blockquoteContent}>
            <Text style={styles.blockquoteText}>
              {children}
            </Text>
          </View>
        </View>
      );
    }
  });

  return components;
};

interface ArticlePDFDocumentProps {
  post: any;
}

/**
 * Declarative Document Layout.
 *
 * IMPORTANT: This component must NOT have 'use client' – it is always imported
 * dynamically (ssr:false) from PDFDownloadButton, so it runs only in the browser.
 * The 'use client' directive causes a React hydration mismatch (#418) because the
 * server never renders this file yet the directive tells React it must match.
 */
export function ArticlePDFDocument({ post }: ArticlePDFDocumentProps) {
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const truncatedTitle =
    post.title && post.title.length > 45
      ? post.title.substring(0, 45) + '…'
      : post.title || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Recurring Header ──────────────────────────────────────────────────
            Uses sibling Text nodes with explicit widths (275 + 220 = 495) instead
            of justifyContent:'space-between', which crashes the PDF engine in v4.x
            when used inside fixed+absolute views.
        */}
        <View style={styles.header} fixed>
          <View style={styles.headerRow}>
            <Text style={styles.headerLeft}>Writen | Sharing Engineering Voice</Text>
            <Text style={styles.headerRight}>{truncatedTitle}</Text>
          </View>
          <View style={styles.divider} />
        </View>

        {/* Optional Cover Banner */}
        {post.coverImage && (
          <Image style={styles.coverImage} src={post.coverImage} />
        )}

        {/* Article Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Post Metadata */}
        <View style={styles.authorRow}>
          <Text>{`By ${post.authorId?.name || 'Anonymous'}  •  Published ${formattedDate}  •  ${post.category || 'General'}`}</Text>
        </View>
        <View style={styles.hr} />

        {/* HTML Parsed Document Content */}
        <View>
          {parseHtmlToPdfComponents(post.htmlContent)}
        </View>

        {/* ── Recurring Footer ──────────────────────────────────────────────────
            Same fix: explicit widths (248 + 247 = 495) instead of space-between.
        */}
        <View style={styles.footer} fixed>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <Text style={styles.footerLeft}>writen.com</Text>
            <Text
              style={styles.footerRight}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
