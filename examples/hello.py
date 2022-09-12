# Simplest Plugin example possible

# NOTE: This is a POC example. We'll need to define what's the best way to expose
#       these methods/classes. Probably through a pyscript package but will leave
#       that for discussion

# Using the register_widget decorator to declare the new components name related to
# the plugin class we are declaring
@register_widget("py-hello")  # noqa: E302 F821
class Hello(PyScriptPlugin):  # noqa: F821

    # visual plugins can use the `connect` hook to be called when the element is attached
    # and will be rendered to the document
    def connect(self):
        self.md = main_div = document.createElement("div")  # noqa: F821
        main_div.id = self._id + "-hello"
        main_div.innerHTML = f"Ciao {self.parent.originalContent}"
        self.parent.appendChild(main_div)
