package tree

type PathMapTree interface {
	Visit(path []string, f PathMapVisitorFunc) error
	Get(path []string) map[string]interface{}
	GetChildren(path []string) (values map[string]*pathMapNode)
	Set(path []string, k string, v interface{})
	Delete(path []string, k string) bool
	DeletePath(path []string)
}

type pathMapNode struct {
	val      map[string]interface{}
	wildcard *pathMapNode
	children map[string]*pathMapNode
}

func NewPathMapTree() PathMapTree {
	return &pathMapNode{}
}

type PathMapVisitorFunc func(v map[string]interface{}) error

func (n *pathMapNode) Visit(path []string, f PathMapVisitorFunc) error {
	for i, element := range path {
		if n.wildcard != nil {
			if err := n.wildcard.Visit(path[i+1:], f); err != nil {
				return err
			}
		}
		next, ok := n.children[element]
		if !ok {
			return nil
		}
		n = next
	}
	if n.val == nil {
		return nil
	}
	return f(n.val)
}

func (n *pathMapNode) Get(path []string) map[string]interface{} {
	for _, element := range path {
		if element == Wildcard {
			if n.wildcard == nil {
				return nil
			}
			n = n.wildcard
			continue
		}
		next, ok := n.children[element]
		if !ok {
			return nil
		}
		n = next
	}
	return n.val
}

func (n *pathMapNode) GetChildren(path []string) (values map[string]*pathMapNode) {
	for _, element := range path {
		if element == Wildcard {
			for n.wildcard != nil {
				n = n.wildcard
			}

			continue
		}
		next, ok := n.children[element]
		if !ok {
			return
		}
		n = next
	}
	if n.children == nil {
		return
	}

	return n.children
}

func (n *pathMapNode) GetLeafs(collection *[]interface{}) {
	if n.val != nil {
		for _, v := range n.val {
			*collection = append(*collection, v)
		}
	}
	if n.wildcard != nil {
		n.wildcard.GetLeafs(collection)
	}
	if n.children != nil {
		for _, child := range n.children {
			child.GetLeafs(collection)
		}
	}
}

func (n *pathMapNode) Set(path []string, k string, v interface{}) {
	for _, element := range path {
		if element == Wildcard {
			if n.wildcard == nil {
				n.wildcard = &pathMapNode{}
			}
			n = n.wildcard
			continue
		}
		if n.children == nil {
			n.children = map[string]*pathMapNode{}
		}
		next, ok := n.children[element]
		if !ok {
			next = &pathMapNode{}
			n.children[element] = next
		}
		n = next
	}
	if n.val == nil {
		n.val = map[string]interface{}{}
	}
	n.val[k] = v
}

func (n *pathMapNode) Delete(path []string, k string) bool {
	nodes := make([]*pathMapNode, len(path)+1)
	for i, element := range path {
		nodes[i] = n
		if element == Wildcard {
			if n.wildcard == nil {
				return false
			}
			n = n.wildcard
			continue
		}
		next, ok := n.children[element]
		if !ok {
			return false
		}
		n = next
	}
	if n.val != nil {
		delete(n.val, k)
	}
	if len(n.val) == 0 {
		n.val = nil
	}
	nodes[len(path)] = n

	// See if we can delete any node objects
	for i := len(path); i > 0; i-- {
		n = nodes[i]
		if n.val != nil || n.wildcard != nil || len(n.children) > 0 {
			break
		}
		parent := nodes[i-1]
		element := path[i-1]
		if element == Wildcard {
			parent.wildcard = nil
		} else {
			delete(parent.children, element)
		}

	}
	return true
}

// todo: write tests for this
func (n *pathMapNode) DeletePath(path []string) {
	nodes := make([]*pathMapNode, len(path)+1)
	for i, element := range path {
		nodes[i] = n
		if element == Wildcard {
			if n.wildcard == nil {
				return
			}
			n = n.wildcard
			continue
		}
		next, ok := n.children[element]
		if !ok {
			return
		}
		n = next
	}
	nodes[len(path)] = n

	// See if we can delete any node objects
	for i := len(path); i > 0; i-- {
		n = nodes[i]
		parent := nodes[i-1]
		element := path[i-1]
		if element == Wildcard {
			parent.wildcard = nil
		} else {
			delete(parent.children, element)
		}
	}
}
