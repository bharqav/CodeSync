export const languageTemplates: Record<string, string> = {
    javascript: `// JavaScript Example
console.log("Hello, CodeSync!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,

    typescript: `// TypeScript Example
interface User {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
};

const user: User = { name: "CodeSync", age: 1 };
console.log(greet(user));`,

    python: `# Python Example
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("Factorial of 5:", factorial(5))

# List comprehension
squares = [x**2 for x in range(10)]
print("Squares:", squares)`,

    java: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeSync!");
        
        int result = sum(10, 20);
        System.out.println("Sum: " + result);
    }
    
    public static int sum(int a, int b) {
        return a + b;
    }
}`,

    cpp: `// C++ Example
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeSync!" << endl;
    
    int arr[] = {1, 2, 3, 4, 5};
    int sum = 0;
    
    for(int i = 0; i < 5; i++) {
        sum += arr[i];
    }
    
    cout << "Sum: " << sum << endl;
    return 0;
}`,

    html: `<!-- HTML Example -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeSync</title>
</head>
<body>
    <h1>Welcome to CodeSync!</h1>
    <p>Real-time collaborative coding.</p>
</body>
</html>`,

    css: `/* CSS Example */
body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}`
};
