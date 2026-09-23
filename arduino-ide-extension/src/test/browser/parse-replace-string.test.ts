import { expect } from 'chai';
import { parseReplaceString } from '../../browser/theia/search-in-workspace/search-in-workspace-result-tree-widget';

describe('parseReplaceString', () => {
  it('should convert \\n to newline', () => {
    expect(parseReplaceString('\\n')).to.equal('\n');
  });

  it('should convert \\t to tab', () => {
    expect(parseReplaceString('\\t')).to.equal('\t');
  });

  it('should convert \\r to carriage return', () => {
    expect(parseReplaceString('\\r')).to.equal('\r');
  });

  it('should convert \\\\ to single backslash', () => {
    expect(parseReplaceString('\\\\')).to.equal('\\');
  });

  it('should handle \\\\n as literal backslash followed by n', () => {
    expect(parseReplaceString('\\\\n')).to.equal('\\n');
  });

  it('should handle mixed content', () => {
    expect(parseReplaceString('hello\\nworld')).to.equal('hello\nworld');
  });

  it('should handle multiple sequences', () => {
    expect(parseReplaceString('\\n\\n')).to.equal('\n\n');
  });

  it('should return unchanged string without escape sequences', () => {
    expect(parseReplaceString('hello')).to.equal('hello');
  });

  it('should handle empty string', () => {
    expect(parseReplaceString('')).to.equal('');
  });

  it('should keep unknown escape sequences as backslash followed by char', () => {
    expect(parseReplaceString('\\x')).to.equal('\\x');
  });

  it('should handle trailing backslash', () => {
    expect(parseReplaceString('hello\\')).to.equal('hello\\');
  });

  it('should handle complex mixed content', () => {
    expect(parseReplaceString('line1\\nline2\\ttabbed\\r\\nwindows')).to.equal(
      'line1\nline2\ttabbed\r\nwindows'
    );
  });

  it('should handle multiple escaped backslashes', () => {
    expect(parseReplaceString('\\\\\\\\')).to.equal('\\\\');
  });

  it('should preserve text around escape sequences', () => {
    expect(parseReplaceString('prefix\\nsuffix')).to.equal('prefix\nsuffix');
  });
});
