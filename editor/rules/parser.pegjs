// Parse entry point
{
  var globals = arguments[1];
  var locals = new Locals();
  var errors = [];
  var lastErrorLength = 0;

  function combine(first, rest, combiners) {
    var result = first, i;

    for (i = 0; i < rest.length; i++) {
      result = combiners[rest[i][1]](result, rest[i][3]);
    }

    return result;
  }
  function Locals() {
    this.stack = [{}];
    this.skipInstruction = [false];
    this.get = function (ident) {
      for (var i = this.stack.length - 1; i >= 0; --i) {
        if (ident in this.stack[i]) {
          return this.stack[i][ident];
        }
      }
      gen_error(ident);
    }
    // Proposal 2
    this.set = function (ident, expr) {
      for (var i = 0; i < this.stack.length; i++) {
        if (ident in this.stack[i]) {
          this.stack[i][ident] = expr;
          return;
        }
      }
      this.stack[this.stack.length - 1][ident] = expr;
    }
    this.push_scope = function (exec) {
      var s = this.skipInstruction[this.skipInstruction.length - 1] || !exec;
      this.skipInstruction.push(s)
      this.stack.push({});
    }
    this.pop_scope = function () { this.stack.pop(); }
    this.should_exec = function () {
      return !this.skipInstruction[this.skipInstruction.length - 1]
    }
    this.flip_instruction_skip_mode = function () {
      // Flip only if the parent scope is not skipped:
      if (this.skipInstruction.length > 1) {
        this.skipInstruction[this.skipInstruction.length - 1] =
          !this.skipInstruction[this.skipInstruction.length - 1] ||
           this.skipInstruction[this.skipInstruction.length - 2];
      } else {
        this.skipInstruction[this.skipInstruction.length - 1] =
          !this.skipInstruction[this.skipInstruction.length - 1];
      }
    }
  }
  //////////////////////////////////////////////////////////////////
  /// Scopes
  ///
  function push_scope(should_exec) {
    locals.push_scope(should_exec);
  }
  function pop_scope() {
    locals.pop_scope();
  }
  function should_exec() {
    return locals.should_exec();
  }
  function flip_instruction_skip_mode() {
    locals.flip_instruction_skip_mode();
  }

  //////////////////////////////////////////////////////////////////
  /// Setters/Getters for stores
  ///
  function get_local(ident)  { return should_exec() ? locals.get(ident): 0;     }
  function get_global(ident) { return should_exec() ? __get(ident, globals, '$' + ident): 0; }
  function set_local(ident, expr)   { locals.set(ident, expr); }
  function set_global(ident, expr)  {
    if (ident in globals) {
      globals[ident] = expr;
    } else {
      gen_error('$' + ident);
    }
  }
  function is_gdef(ident)          { return __defined(ident, globals); }
  function __defined(ident, store) { return ident in store; }
  function __get(ident, store, ident_name) {
    if (__defined(ident, store)) {
      return store[ident];
    }
    gen_error(ident_name || ident);
  }

  //////////////////////////////////////////////////////////////////
  /// Error handling
  ///
  function gen_error(ident) {
    var pos = location();
    errors.push(new IllFormedError(
      "`" + ident + "` doesn't exists.",
      "",
      "",
      pos
    ));
  }
  function IllFormedError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.location = location;
    this.name     = "IllFormedError";
  }
  function subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }
  subclass(IllFormedError, Error);
}

//////////////////////////////////////////////////////////////////
/// PEG Grammar for AaribaScript
///

Program
  = InstructionList {
    if (errors.length > 0) {
      throw errors[0];
    }
    return locals.stack;
  }

InstructionList
  = ins_list:(_ Instruction _)*

Instruction
  = Comment
  / Assignment
  / IfStatement

Comment "comment"
  = "//" [^\n\r]* [\n\r]?

IfStatement
  = "if" _ ident:GlobalIdent _ "{" ! { push_scope(is_gdef(ident)); }
      _? InstructionList
  ( "}" _ Else
  / "}" ! { pop_scope(); } )

Else
  = "else" _ "{" ! { flip_instruction_skip_mode(); }
      _? InstructionList
  "}" ! { pop_scope(); }

Assignment
  = ident:LocalIdent _ expr:LValue ";" {
    if (should_exec()) {
      set_local(ident, expr);
    }
  }
  / ident:GlobalIdent _ expr:LValue ";" {
    if (should_exec()) {
      set_global(ident, expr);
    }
  }

LValue
  = "=" ! { lastErrorLength = errors.length; } _ expr:Expression _ "?"? _ or:Expression? {
    if (lastErrorLength == errors.length) { return expr; }
    if (typeof or === 'number') {
      errors = errors.slice(0, lastErrorLength).concat(errors.slice(lastErrorLength + 1));
      if (lastErrorLength === errors.length - 1) {
        return or;
      }
    }
  }

Expression
  = first:Term rest:(_ ("+" / "-") _ Term)* {
      return combine(first, rest, {
        "+": function(left, right) { return left + right; },
        "-": function(left, right) { return left - right; }
      });
    }

Term
  = first:Factor rest:(_ ("*" / "/" / "^" / "%") _ Factor)* {
      return combine(first, rest, {
        "*": function(left, right) { return left * right; },
        "/": function(left, right) { return left / right; },
        "^": function(left, right) { return Math.pow(left, right); },
        "%": function(left, right) { return left % right; }
      });
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / res:Function                { return res; }
  / gident:GlobalIdent          { return get_global(gident); }
  / ident:LocalIdent            { return get_local(ident); }
  / Number

LocalIdent "local variable"
  = [a-zA-Z_\u00a1-\uffff][\.0-9a-zA-Z_\u00a1-\uffff]* {
    return text();
  }

GlobalIdent "global variable"
  = [\$][a-zA-Z_\u00a1-\uffff\d][\.0-9a-zA-Z_\u00a1-\uffff]* {
    return text().substring(1);
  }

Function
  = "sin"  _ "(" _ expr:Expression _ ")" { return Math.sin(expr); }
  / "cos"  _ "(" _ expr:Expression _ ")" { return Math.cos(expr); }
  / "tan"  _ "(" _ expr:Expression _ ")" { return Math.tan(expr); }
  / "rand" _ "(" _ expr:Expression? _ ")" { return expr ? Math.random() * expr: Math.random(); }
  / "max"  _ "(" _ a:Expression _ "," _ b:Expression _ ")" { return Math.max(a, b); }
  / "min"  _ "(" _ a:Expression _ "," _ b:Expression _ ")" { return Math.min(a, b); }

Number "number"
  = Minus? Int Frac? Exp? { return parseFloat(text()); }

DecimalPoint  = "."
Digit1_9      = [1-9]
Digit         = [0-9]
E             = [eE]
Exp           = E (Minus / Plus)? Digit+
Frac          = DecimalPoint Digit+
Int           = Zero / (Digit1_9 Digit*)
Minus         = "-"
Plus          = "+"
Zero          = "0"

_ "whitespace"
  = [ \t\n\r]*
