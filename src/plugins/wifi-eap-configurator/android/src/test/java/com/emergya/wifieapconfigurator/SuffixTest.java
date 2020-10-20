package com.emergya.wifieapconfigurator;

import junit.framework.TestCase;

public class SuffixTest extends TestCase {
	static private <T> void revert(T[] array) {
		for(int i=0; i<array.length/2; i++){
			T temp = array[i];
			array[i] = array[array.length -i -1];
			array[array.length -i -1] = temp;
		}
	}
	
	private static void testSuffix(String expected, String[] actual) {
		assertEquals(expected, WifiEapConfigurator.getLongestSuffix(actual));
		revert(actual);
		assertEquals(expected, WifiEapConfigurator.getLongestSuffix(actual));
	}
	
	public void testZero() {
		testSuffix("", 
				new String[0]
			);
	}
	public void testOne() {
		testSuffix("example.com", 
				new String[] {"example.com"}
			);
	}
	public void testZeroSegment() {
		testSuffix("", 
				new String[] {"junit.example.com", "junit.example.org"}
			);
	}
	public void testOneSegment() {
		testSuffix("com", 
				new String[] {"junit.example.com", "junit.java.com"}
			);
	}
	public void testTwoSegment() {
		testSuffix("example.com", 
				new String[] {"junit.example.com", "else.example.com"}
			);
	}
	public void testEmptySegment() {
		testSuffix("", 
				new String[] {"example.com", ""}
			);
	}
	public void testDifferentSegmentLength() {
		testSuffix("com", 
				new String[] {"example.com", "com"}
			);
	}
	public void testOddOneOut() {
		testSuffix("", 
				new String[] {"sub.example.com", "sub.example.org", "sub.example.com", "sub.example.com"}
			);
	}
}
