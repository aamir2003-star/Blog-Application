'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define PDF styles matching the Writen branding
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
    right: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: '#bbcabb',
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#5f5e5e',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: '#bbcabb',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#5f5e5e',
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
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#bbcabb',
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
  codeBlock: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    backgroundColor: '#f4f4f2',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    lineHeight: 1.35,
    whiteSpace: 'pre-wrap',
  },
  coverImage: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    borderRadius: 6,
    marginBottom: 16,
  },
  inlineImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
    marginVertical: 10,
  },
  hr: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#bbcabb',
    marginVertical: 12,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#006d38',
    paddingLeft: 10,
    marginVertical: 10,
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
      components.push(
        <Text key={index} style={styles.codeBlock}>
          {codeText || ''}
        </Text>
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
          <Text style={styles.blockquoteText}>
            {children}
          </Text>
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
          <Text>Writen | Sharing Engineering Voice</Text>
          <Text style={{ maxWidth: 220 }}>
            {post.title && post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title}
          </Text>
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

        {/* HTML Parsed Document Content blocks */}
        <View>
          {parseHtmlToPdfComponents(post.htmlContent)}
        </View>

        {/* Recurring Footer with Page Numbers */}
        <View style={styles.footer} fixed>
          <Text>writen.com</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
