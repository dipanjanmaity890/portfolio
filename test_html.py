from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.self_closing = ['meta', 'link', 'img', 'br', 'hr', 'input', 'source']

    def handle_starttag(self, tag, attrs):
        if tag not in self.self_closing:
            self.tags.append(tag)

    def handle_endtag(self, tag):
        if tag in self.self_closing: return
        if not self.tags:
            print(f"Error: unmatched closing tag </{tag}> at line {self.getpos()[0]}")
            return
        last = self.tags.pop()
        if last != tag:
            print(f"Error: expected </{last}>, got </{tag}> at line {self.getpos()[0]}")
            self.tags.append(last)

parser = MyHTMLParser()
with open('index.html', 'r') as f:
    parser.feed(f.read())
if parser.tags:
    print("Unclosed tags:", parser.tags)
else:
    print("HTML structure is balanced.")
