"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _core = require("babel-core");
var _ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", ">>>=", "|=", "^=", "&="];
var _default = (api => {
  return {
    name: "non-logical-assignment-operators",
    visitor: {
      AssignmentExpression(path) {
        const {
          node,
          scope
        } = path;
        const {
          operator,
          left,
          right
        } = node;
        if (operator === "=") {
          return;
        }
        const operatorTrunc = operator.slice(0, -1);
        if (!_ASSIGNMENT_OPERATORS.includes(operator)) {
          return;
        }
        const lhs = _core.types.cloneDeep(left);
        if (_core.types.isMemberExpression(left)) {
          const {
            object,
            property,
            computed
          } = left;
          const memo = scope.maybeGenerateMemoised(object);
          if (memo) {
            left.object = memo;
            lhs.object = _core.types.assignmentExpression("=", _core.types.cloneDeep(memo), object);
          }
          if (computed) {
            const memo = scope.maybeGenerateMemoised(property);
            if (memo) {
              left.property = memo;
              lhs.property = _core.types.assignmentExpression("=", _core.types.cloneDeep(memo), property);
            }
          }
        }
        path.replaceWith(_core.types.assignmentExpression("=", lhs, _core.types.binaryExpression(operatorTrunc, left, right)));
      }
    }
  };
});
exports.default = _default;

//# sourceMappingURL=index.js.map
