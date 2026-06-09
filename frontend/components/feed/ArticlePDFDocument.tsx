'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define stable PDF styles matching the Writen branding
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
  header: {
    position: 'absolute',
    top: 30,
    left: 50,
    width: 495,
    fontSize: 8,
    color: '#5f5e5e',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    width: 495,
    fontSize: 8,
    color: '#5f5e5e',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#bbcabb',
    width: '100%',
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
    alignItems: 'center',
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
    flex: 1,
  },
  codeContainer: {
    backgroundColor: '#f4f4f2',
    padding: 8,
    marginBottom: 8,
    width: 495,
  },
  codeLine: {
    fontFamily: 'Courier',
    fontSize: 8,
    lineHeight: 1.3,
  },
  coverImage: {
    width: 495,
    height: 180,
    marginBottom: 16,
  },
  inlineImage: {
    width: 495,
    height: 150,
    marginVertical: 10,
  },
  hr: {
    height: 0.5,
    backgroundColor: '#bbcabb',
    marginVertical: 12,
    width: '100%',
  },
  blockquote: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  blockquoteBar: {
    width: 3,
    backgroundColor: '#006d38',
  },
  blockquoteContent: {
    flex: 1,
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
    
    const style: any = {};
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
 */
const parseHtmlToPdfComponents = (html: string) => {
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
              {line}
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
 */
export function ArticlePDFDocument({ post }: ArticlePDFDocumentProps) {
  const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Recurring Header */}
        <View style={styles.header} fixed>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
            <Text>Writen | Sharing Engineering Voice</Text>
            <Text style={{ maxWidth: 220 }}>
              {post.title && post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title}
            </Text>
          </View>
          <View style={styles.divider} />
        </View>

        {/* Optional Cover Banner */}
        {post.coverImage && (
          <Image style={styles.coverImage} src={post.coverImage} />
        )}

        {/* Article Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Post Metadata Card */}
        <View style={styles.authorRow}>
          <Text>{`By ${post.authorId?.name || 'Anonymous'}  •  Published ${formattedDate}  •  ${post.category || 'General'}`}</Text>
        </View>
        <View style={styles.hr} />

        {/* HTML Parsed Document Content blocks */}
        <View>
          {parseHtmlToPdfComponents(post.htmlContent)}
        </View>

        {/* Recurring Footer with Page Numbers */}
        <View style={styles.footer} fixed>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
            <Text>writen.com</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
