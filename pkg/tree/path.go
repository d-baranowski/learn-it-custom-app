package tree

type PathTree interface {
	// Visit calls f for every registration in the PathMap that
	// matches path. For example,
	//
	// m.Set({"foo", "bar"}, 1)
	// m.Set({"*", "bar"}, 2)
	//
	// m.Visit({"foo", "bar"}, Printer)
	// >> Calls Printer(1) and Printer(2)
	Visit(path []string, f PathVisitorFunc) error

	// Get returns the mapping for path. This returns the exact
	// mapping for path. For example, if you register two paths
	//
	// m.Set({"foo", "bar"}, 1)
	// m.Set({"*", "bar"}, 2)
	//
	// m.Get({"foo", "bar"}) => 1
	// m.Get({"*", "bar"}) => 2
	Get(path []string) (interface{}, bool)

	// Set a mapping of path to value. Path may contain wildcards. Set
	// replaces what was there before.
	Set(path []string, v interface{})

	// Delete removes the mapping for path
	Delete(path []string) bool
}

// Wildcard is a special string representing any possible path
const Wildcard string = "*"

type pathNode struct {
	val      interface{}
	wildcard *pathNode
	children map[string]*pathNode
}

func NewPathTree() PathTree {
	return &pathNode{}
}

// PathVisitorFunc is the func type passed to Visit
type PathVisitorFunc func(v interface{}) error

// Visit calls f for every matching registration in the PathMap
func (n *pathNode) Visit(path []string, f PathVisitorFunc) error {
	for i, element := range path {
		// todo: add exclusions here

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

// Get returns the mapping for path
func (n *pathNode) Get(path []string) (interface{}, bool) {
	for _, element := range path {
		if element == Wildcard {
			if n.wildcard == nil {
				return nil, false
			}
			n = n.wildcard
			continue
		}
		next, ok := n.children[element]
		if !ok {
			return nil, false
		}
		n = next
	}
	return n.val, true
}

// Set a mapping of path to value. Path may contain wildcards. Set
// replaces what was there before.
func (n *pathNode) Set(path []string, v interface{}) {
	for _, element := range path {
		if element == Wildcard {
			if n.wildcard == nil {
				n.wildcard = &pathNode{}
			}
			n = n.wildcard
			continue
		}
		if n.children == nil {
			n.children = map[string]*pathNode{}
		}
		next, ok := n.children[element]
		if !ok {
			next = &pathNode{}
			n.children[element] = next
		}
		n = next
	}
	n.val = v
}

// Delete removes the mapping for path
func (n *pathNode) Delete(path []string) bool {
	nodes := make([]*pathNode, len(path)+1)
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
	n.val = nil
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
